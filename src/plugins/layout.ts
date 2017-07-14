import { config } from "./../config";
import { addEvent, bind, getTimestamp, instrument } from "./../core";
import { debug, isNumber, traverseNodeTree } from "./../utils";
import { ShadowDom } from "./layout/shadowdom";
import { createGenericLayoutState, createLayoutState, getNodeIndex, IgnoreTag, NodeIndex } from "./layout/stateprovider";

export default class Layout implements IPlugin {
  private eventName = "Layout";
  private distanceThreshold = 5;
  private shadowDom: ShadowDom;
  private shadowDomConsistent: boolean;
  private observer: MutationObserver;
  private watchList: boolean[];
  private mutationSequence: number;
  private domDiscoverComplete: boolean;
  private domPreDiscoverMutations: ILayoutEventInfo[][];
  private lastConsistentDomJson: object;
  private layoutStates: ILayoutState[];
  private originalLayouts: Array<{
    node: Node;
    layout: ILayoutState;
  }>;

  public reset(): void {
    this.shadowDom = new ShadowDom();
    this.shadowDomConsistent = false;
    this.watchList = [];
    this.observer = window["MutationObserver"] ? new MutationObserver(this.mutation.bind(this)) : null;
    this.mutationSequence = 0;
    this.domDiscoverComplete = false;
    this.domPreDiscoverMutations = [];
    this.lastConsistentDomJson = {};
    this.layoutStates = [];
    this.originalLayouts = [];
  }

  public activate(): void {
    this.discoverDom();
    if (this.observer) {
      this.observer.observe(document, {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true,
        attributeOldValue: true,
        characterDataOldValue: true
      });
    }
  }

  public teardown(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Clean up node indices on observed nodes
    // If Clarity is re-activated within the same page later,
    // old, uncleared indices would cause it to work incorrectly
    let allNodes = this.shadowDom.doc.querySelectorAll("*");
    for (let i = 0; i < allNodes.length; i++) {
      let node = (allNodes[i] as IShadowDomNode).node;
      if (node) {
        delete node[NodeIndex];
      }
    }
  }

  // Recording full layouts of all elements on the page at once is an expensive operation
  // and can impact user's experience by hanging the page due to occupying the thread for too long
  // To avoid this, we only assign indices to all elements and build a ShadowDom with dummy layouts
  // just to have a valid DOM skeleton. After that, we can come back to dummy layouts and populate
  // them with real data asynchronously (if it takes too long to do at once) by yielding a thread
  // and returning to it later through a set timeout
  private discoverDom() {
    let discoverTime = getTimestamp();
    traverseNodeTree(document, this.discoverNode.bind(this));
    this.ensureConsistency("Discover DOM");
    setTimeout(() => {
      this.backfillLayoutsAsync(discoverTime, this.onDomDiscoverComplete.bind(this));
    }, 0);
  }

  // Add node to the ShadowDom to store initial adjacent node info in a layout and obtain an index
  private discoverNode(node: Node) {
    this.shadowDom.insertShadowNode(node, getNodeIndex(node.parentNode), getNodeIndex(node.nextSibling));
    let index = getNodeIndex(node);
    let layout = createGenericLayoutState(node, null);
    this.layoutStates[index] = layout;
    this.originalLayouts.push({
      node,
      layout
    });

    if (layout.tag === IgnoreTag) {
      this.shadowDom.getShadowNode(index).ignore = true;
    }
  }

  // Go back to the nodes that were stored with a dummy layout during the DOM discovery
  // and compute valid layouts for those nodes. Since there can be many layouts to process,
  // this function will yield a thread, if it is taking too long and will return to processing
  // remaining layouts ASAP through the setTimeout call.
  // Because of its potential async nature, it is possible that by the time we get to processing
  // a layout of some element, there has been a mutation on it, so its properties could have changed.
  // To handle this, until we record all initial layouts, MutationObserver's callback function will
  // evaluate whether some mutation changes node's attributes/characterData for the first time and,
  // if it does, store original values. Then, when we record the layout of the mutated node,
  // we can adjust the current layout JSON with the original values to mimic its initial state.
  private backfillLayoutsAsync(time: number, onDomDiscoverComplete: () => void) {
    let yieldTime = getTimestamp(true) + config.timeToYield;
    while (this.originalLayouts.length > 0 && getTimestamp(true) < yieldTime) {
      let originalLayout = this.originalLayouts.shift();
      let originalLayoutState = originalLayout.layout;
      let currentLayoutState = createLayoutState(originalLayout.node, this.shadowDom);

      currentLayoutState.index = originalLayout.layout.index;
      currentLayoutState.parent = originalLayoutState.parent;
      currentLayoutState.previous = originalLayoutState.previous;
      currentLayoutState.next = originalLayoutState.next;
      currentLayoutState.source = Source.Discover;
      currentLayoutState.action = Action.Insert;

      addEvent(this.eventName, currentLayoutState, time);
    }

    // If there are more elements that need to be processed, yield the thread and return ASAP
    if (this.originalLayouts.length > 0) {
      setTimeout(() => {
        this.backfillLayoutsAsync(time, onDomDiscoverComplete);
      }, 0);
    } else {
      onDomDiscoverComplete();
    }
  }

  // Mark dom discovery process completed and process mutations that happened on the page up to this point
  private onDomDiscoverComplete() {
    this.domDiscoverComplete = true;
    for (let i = 0; i < this.domPreDiscoverMutations.length; i++) {
      let mutationEvents = this.domPreDiscoverMutations[i];
      for (let j = 0; j < mutationEvents.length; j++) {
        this.processNodeEvent(mutationEvents[j]);
      }
    }
  }

  private processNodeEvent<T extends ILayoutEventInfo>(eventInfo: T) {
    let node = eventInfo.node;
    let layoutState: ILayoutState = createLayoutState(node, this.shadowDom);
    switch (eventInfo.action) {
      case Action.Insert:
        // Watch element for scroll and input change events
        if (node.nodeType === Node.ELEMENT_NODE) {
          this.watch(node as Element, layoutState as IElementLayoutState);
        }
        if (layoutState.tag === IgnoreTag) {
          this.shadowDom.getShadowNode(eventInfo.index).ignore = true;
        }
        layoutState.action = Action.Insert;
        break;
      case Action.Update:
        layoutState.action = Action.Update;
        break;
      case Action.Remove:
        // Index is passed explicitly because indices on removed nodes are cleared,
        // so at this point we can't obtain node's index from the node itself
        layoutState.index = eventInfo.index;
        layoutState.action = Action.Remove;
        break;
      case Action.Move:
        layoutState.action = Action.Move;
        break;
      default:
        break;
    }

    if (eventInfo.source === Source.Mutation) {
      layoutState.mutationSequence = this.mutationSequence;
    }
    layoutState.source = eventInfo.source;
    this.layoutStates[eventInfo.index] = layoutState;
    addEvent(this.eventName, layoutState);
  }

  private watch(element: Element, layoutState: IElementLayoutState) {

    // We only wish to watch elements once and then wait on the events to push changes
    if (this.watchList[layoutState.index]) {
      return;
    }

    // Check if scroll is possible, and if so, bind to scroll event
    let styles = window.getComputedStyle(element);
    let scrollPossible = (layoutState.layout !== null
                          && (styles["overflow-x"] === "auto"
                              || styles["overflow-x"] === "scroll"
                              || styles["overflow-y"] === "auto"
                              || styles["overflow-y"] === "scroll"));
    if (scrollPossible) {
      layoutState.layout.scrollX = Math.round(element.scrollLeft);
      layoutState.layout.scrollY = Math.round(element.scrollTop);
      bind(element, "scroll", this.layoutHandler.bind(this, element, Source.Scroll));
      this.watchList[layoutState.index] = true;
    }

    // Check if we need to monitor changes to input fields
    if (element.tagName === "INPUT") {
      bind(element, "change", this.layoutHandler.bind(this, element, Source.Input));
      this.watchList[layoutState.index] = true;
    }
  }

  private layoutHandler(element: Element, source: Source) {
    let index = getNodeIndex(element);
    let recordEvent = true;
    if (index !== null) {
      let time = getTimestamp();
      let lastLayoutState = this.layoutStates[index];

      // Deep-copy an existing layout JSON
      let newLayoutState: IElementLayoutState = JSON.parse(JSON.stringify(lastLayoutState));
      newLayoutState.source = source;
      newLayoutState.action = Action.Update;

      switch (source) {
        case Source.Scroll:
          newLayoutState.layout.scrollX = Math.round(element.scrollLeft);
          newLayoutState.layout.scrollY = Math.round(element.scrollTop);
          if (lastLayoutState && !this.checkDistance(lastLayoutState as IElementLayoutState, newLayoutState)) {
            recordEvent = false;
          }
          break;
        case Source.Input:
          newLayoutState.attributes.value = element["value"];
          break;
        default:
          break;
      }

      // Update the reference of layouts object to current state
      if (recordEvent) {
        this.layoutStates[index] = newLayoutState;
        addEvent(this.eventName, newLayoutState);
      }
    }
  }

  private checkDistance(stateOne: IElementLayoutState, stateTwo: IElementLayoutState) {
    let dx = stateOne.layout.scrollX - stateTwo.layout.scrollX;
    let dy = stateOne.layout.scrollY - stateTwo.layout.scrollY;
    return (dx * dx + dy * dy > this.distanceThreshold * this.distanceThreshold);
  }

  private mutation(mutations: MutationRecord[]) {

    // Don't process mutations on top of the inconsistent state.
    // ShadowDom mutation processing logic requires consistent state as a prerequisite.
    // If we end up in the inconsistent state, that means that something went wrong already,
    // so we can give up on the following mutations and should investigate the cause of the error.
    // Continuing to process mutations can result in javascript errors and lead to even more inconsistencies.
    if (this.shadowDomConsistent) {

      // Perform mutations on the shadow DOM and make sure ShadowDom arrived to the consistent state
      let time = getTimestamp();
      let summary = this.shadowDom.applyMutationBatch(mutations);
      this.ensureConsistency(`Mutation ${this.mutationSequence}`);

      if (this.shadowDomConsistent) {
        let events = this.processMutations(summary, time);
        if (this.domDiscoverComplete) {
          for (let i = 0; i < events.length; i++) {
            this.processNodeEvent(events[i]);
          }
        } else {
          this.domPreDiscoverMutations.push(events);
        }
      } else {
        debug(`>>> ShadowDom doesn't match PageDOM after mutation batch #${this.mutationSequence}!`);
      }
    }

    this.mutationSequence++;
  }

  private processMutations(summary: IShadowDomMutationSummary, time: number): ILayoutEventInfo[] {
    let events: ILayoutEventInfo[] = [];

    // Process new nodes
    for (let i = 0; i < summary.newNodes.length; i++) {
      let node = summary.newNodes[i].node;
      events.push({
        node,
        index: getNodeIndex(node),
        source: Source.Mutation,
        action: Action.Insert,
        time
      });
    }

    // Process moves
    for (let i = 0; i < summary.movedNodes.length; i++) {
      let node = summary.movedNodes[i].node;
      events.push({
        node,
        index: getNodeIndex(node),
        source: Source.Mutation,
        action: Action.Move,
        time
      });
    }

    // Process updates
    for (let i = 0; i < summary.updatedNodes.length; i++) {
      let node = summary.updatedNodes[i].node;
      events.push({
        node,
        index: getNodeIndex(node),
        source: Source.Mutation,
        action: Action.Update,
        time
      });
    }

    // Process removes
    for (let i = 0; i < summary.removedNodes.length; i++) {
      let shadowNode = summary.removedNodes[i] as IShadowDomNode;
      events.push({
        node: shadowNode.node,
        index: getNodeIndex(shadowNode.node),
        source: Source.Mutation,
        action: Action.Remove,
        time
      });
      traverseNodeTree(shadowNode, (removedShadowNode: IShadowDomNode) => {
        delete removedShadowNode.node[NodeIndex];
      });
    }

    return events;
  }

  private ensureConsistency(lastAction: string): void {
    let domJson = this.shadowDom.createDomIndexJson();
    this.shadowDomConsistent = this.shadowDom.isConsistent();
    if (this.shadowDomConsistent) {
      this.lastConsistentDomJson = domJson;
    } else {
      let evt: IShadowDomInconsistentEventState = {
        type: Instrumentation.ShadowDomInconsistent,
        dom: JSON.stringify(domJson),
        shadowDom: JSON.stringify(this.shadowDom.createShadowDomIndexJson()),
        lastAction,
        lastConsistentShadowDom: JSON.stringify(this.lastConsistentDomJson)
      };
      instrument(evt);
    }
  }
}
