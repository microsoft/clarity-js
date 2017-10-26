import { Action, IElementLayoutState, IEventData, ILayoutEventInfo, ILayoutRoutineInfo, ILayoutState, IMutationRoutineInfo,
  Instrumentation, IPlugin, IShadowDomInconsistentEventState, IShadowDomMutationSummary, IShadowDomNode, LayoutRoutine,
  NumberJson, Source } from "../../clarity";
import { config } from "./../config";
import { addEvent, addMultipleEvents, bind, getTimestamp, instrument } from "./../core";
import { debug, isNumber, traverseNodeTree } from "./../utils";
import * as eventProvider from "./layout/eventprovider";
import { ShadowDom } from "./layout/shadowdom";
import { createGenericLayoutState, createIgnoreLayoutState, createLayoutState, getElementAttributes } from "./layout/stateprovider";
import { getNodeIndex, IgnoreTag, NodeIndex, shouldIgnoreNode } from "./layout/stateprovider";

export default class Layout implements IPlugin {
  private eventName = "Layout";
  private distanceThreshold = 5;
  private shadowDom: ShadowDom;
  private inconsistentShadowDomCount: number;
  private observer: MutationObserver;
  private watchList: boolean[];
  private mutationSequence: number;
  private domPreDiscoverMutations: ILayoutEventInfo[][];
  private domDiscoverComplete: boolean;
  private lastConsistentDomJson: NumberJson;
  private firstShadowDomInconsistentEvent: IShadowDomInconsistentEventState;
  private layoutStates: ILayoutState[];
  private originalLayouts: Array<{
    node: Node;
    layout: ILayoutState;
  }>;

  public reset(): void {
    this.shadowDom = new ShadowDom();
    this.inconsistentShadowDomCount = 0;
    this.watchList = [];
    this.observer = window["MutationObserver"] ? new MutationObserver(this.mutation.bind(this)) : null;
    this.mutationSequence = 0;
    this.domDiscoverComplete = false;
    this.domPreDiscoverMutations = [];
    this.lastConsistentDomJson = null;
    this.firstShadowDomInconsistentEvent = null;
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
        subtree: true
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
    let documentShadowNode = this.shadowDom.shadowDocument;
    if (documentShadowNode.node) {
      delete documentShadowNode.node[NodeIndex];
    }
    let otherNodes = this.shadowDom.shadowDocument.querySelectorAll("*");
    for (let i = 0; i < otherNodes.length; i++) {
      let node = (otherNodes[i] as IShadowDomNode).node;
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
    this.checkConsistency({
      action: LayoutRoutine.DiscoverDom
    });
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
    let events: IEventData[] = [];
    while (this.originalLayouts.length > 0 && getTimestamp(true) < yieldTime) {
      let originalLayout = this.originalLayouts.shift();
      let originalLayoutState = originalLayout.layout;
      let currentLayoutState = createLayoutState(originalLayout.node, this.shadowDom);
      let index = originalLayout.layout.index;
      currentLayoutState.index = index;
      currentLayoutState.parent = originalLayoutState.parent;
      currentLayoutState.previous = originalLayoutState.previous;
      currentLayoutState.next = originalLayoutState.next;

      let event: IDiscover = {
        index,
        action: Action.Discover,
        state: currentLayoutState
      };

      events.push({
        type: this.eventName,
        state: event,
        time
      });
      this.layoutStates[index] = currentLayoutState;
    }
    addMultipleEvents(events);

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
      this.processMultipleNodeEvents(this.domPreDiscoverMutations[i]);
    }
  }

  private processMultipleNodeEvents<T extends ILayoutEventInfo>(eventInfos: T[]) {
    let eventsData: IEventData[] = [];
    for (let i = 0; i < eventInfos.length; i++) {
      let eventState = this.createEvent(eventInfos[i]);
      if (eventState) {
        eventsData.push({
          type: this.eventName,
          state: eventState
        });
      }
    }
    addMultipleEvents(eventsData);
  }

  private createEvent<T extends ILayoutEventInfo>(eventInfo: T): ILayoutEvent {
    let event: ILayoutEvent = null;
    let index = eventInfo.index;
    switch (eventInfo.action) {
      case Action.Insert:
        let insertedElement = eventInfo.node as Element;
        let insertEvent = event = eventProvider.createInsert(insertedElement, this.shadowDom, this.mutationSequence);
        this.layoutStates[index] = insertEvent.state;
        // Watch element for scroll and input change events
        this.watch(insertedElement);
        break;
      case Action.Remove:
        // Index is passed explicitly because indices on removed nodes are cleared,
        // so at this point we can't obtain node's index from the node itself
        event = eventProvider.createRemove(index, this.mutationSequence);
        break;
      case Action.Move:
        let movedNode = eventInfo.node;
        event = eventProvider.createMove(movedNode, this.mutationSequence);
        break;
      case Action.AttributeUpdate:
        let previousElementState = this.layoutStates[index] as IElementLayoutState;
        let updatedElement = eventInfo.node as Element;
        if (previousElementState.tag !== IgnoreTag) {
          let currentAttributes = getElementAttributes(updatedElement);
          event = eventProvider.createAttributeUpdate(updatedElement, previousElementState.attributes, this.mutationSequence);
          previousElementState.attributes = currentAttributes;
        }
        // Watch element for scroll and input change events
        this.watch(updatedElement);
        break;
      case Action.CharacterDataUpdate:
        let previousTextState = this.layoutStates[index] as ITextLayoutState;
        let updatedNode = eventInfo.node as CharacterDataNode;
        event = eventProvider.createCharacterDataUpdate(updatedNode, previousTextState.content , this.mutationSequence);
        break;
      case Action.Scroll:
      case Action.Input:
        // TODO: Currently scrolls and inputs are handled separately in layout handler
        // Look into a single processing pipeline for all events
        break;
      default:
        break;
    }
    return event;
  }

  private watch(element: Element) {
    let index = getNodeIndex(element);

    // We only wish to watch elements once and then wait on the events to push changes
    if (element.nodeType !== Node.ELEMENT_NODE || this.watchList[index]) {
      return;
    }

    let layoutState = this.layoutStates[index] as IElementLayoutState;
    let layout = layoutState.layout;
    let scrollPossible = (layout && ("scrollX" in layout || "scrollY" in layout));
    if (scrollPossible) {
      bind(element, "scroll", this.onScroll.bind(this, element));
      this.watchList[layoutState.index] = true;
    }

    // Check if we need to monitor changes on input fields
    if (element.tagName === "INPUT" || element.tagName === "SELECT") {
      bind(element, "change", this.onInput.bind(this, element));
      this.watchList[index] = true;
    } else if (element.tagName === "TEXTAREA") {
      bind(element, "input", this.onInput.bind(this, element));
      this.watchList[index] = true;
    }
  }

  private onScroll(element: Element) {
    let index = getNodeIndex(element);
    let layoutState = this.layoutStates[index] as IElementLayoutState;
    let event = eventProvider.createScroll(element);
    let newScrollX = Math.round(element.scrollLeft);
    let newScrollY = Math.round(element.scrollTop);
    if (this.checkDistance(layoutState.layout.scrollX, layoutState.layout.scrollY, event.scrollX, event.scrollY)) {
      layoutState.layout.scrollX = newScrollX;
      layoutState.layout.scrollY = newScrollY;
      addEvent({type: this.eventName, state: event});
    }
  }

  private onInput(inputElement: InputElement) {
    let event = eventProvider.createInput(inputElement);
    (this.layoutStates[getNodeIndex(inputElement)] as IInputLayoutState).value  = event.value;
    addEvent({type: this.eventName, state: event});
  }

  private checkDistance(lastScrollX: number, lastScrollY: number, newScrollX: number, newScrollY: number) {
    let dx = lastScrollX - newScrollX;
    let dy = lastScrollY - newScrollY;
    return (dx * dx + dy * dy > this.distanceThreshold * this.distanceThreshold);
  }

  private mutation(mutations: MutationRecord[]) {

    // Don't process mutations on top of the inconsistent state.
    // ShadowDom mutation processing logic requires consistent state as a prerequisite.
    // If we end up in the inconsistent state, that means that something went wrong already,
    // so we can give up on the following mutations and should investigate the cause of the error.
    // Continuing to process mutations can result in javascript errors and lead to even more inconsistencies.
    if (this.allowMutation()) {

      // Perform mutations on the shadow DOM and make sure ShadowDom arrived to the consistent state
      let time = getTimestamp();
      let summary = this.shadowDom.applyMutationBatch(mutations);
      let actionInfo: IMutationRoutineInfo = {
        action: LayoutRoutine.Mutation,
        mutationSequence: this.mutationSequence,
        batchSize: mutations.length
      };
      this.checkConsistency(actionInfo);

      if (this.allowMutation()) {
        let events = this.processMutations(summary, time);
        if (this.domDiscoverComplete) {
          this.processMultipleNodeEvents(events);
        } else {
          this.domPreDiscoverMutations.push(events);
        }
      } else {
        debug(`>>> ShadowDom doesn't match PageDOM after mutation batch #${this.mutationSequence}!`);
      }
    }

    this.mutationSequence++;
  }

  private allowMutation(): boolean {
    return this.inconsistentShadowDomCount < 2 || !config.validateConsistency;
  }

  private processMutations(summary: IShadowDomMutationSummary, time: number): ILayoutEventInfo[] {
    let events: ILayoutEventInfo[] = [];

    // Process new nodes
    for (let i = 0; i < summary.newNodes.length; i++) {
      let node = summary.newNodes[i].node;
      events.push({
        node,
        index: getNodeIndex(node),
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
        action: Action.Move,
        time
      });
    }

    // Process updates
    for (let i = 0; i < summary.updatedNodes.length; i++) {
      let node = summary.updatedNodes[i].node;
      let action = node.nodeType === Node.ELEMENT_NODE ? Action.AttributeUpdate : Action.CharacterDataUpdate;
      events.push({
        node,
        index: getNodeIndex(node),
        action,
        time
      });
    }

    // Process removes
    for (let i = 0; i < summary.removedNodes.length; i++) {
      let shadowNode = summary.removedNodes[i] as IShadowDomNode;
      events.push({
        node: shadowNode.node,
        index: getNodeIndex(shadowNode.node),
        action: Action.Remove,
        time
      });
      traverseNodeTree(shadowNode, (removedShadowNode: IShadowDomNode) => {
        delete removedShadowNode.node[NodeIndex];
      });
    }

    return events;
  }

  private checkConsistency(lastActionInfo: ILayoutRoutineInfo): void {
    if (config.validateConsistency) {
      let domJson = this.shadowDom.createIndexJson(document, (node: Node) => {
        return getNodeIndex(node);
      });
      let shadowDomConsistent = this.shadowDom.isConsistent();
      if (!shadowDomConsistent) {
        this.inconsistentShadowDomCount++;
        let shadowDomJson = this.shadowDom.createIndexJson(this.shadowDom.shadowDocument, (node: Node) => {
          return parseInt((node as IShadowDomNode).id, 10);
        });
        let evt: IShadowDomInconsistentEventState = {
          type: Instrumentation.ShadowDomInconsistent,
          dom: domJson,
          shadowDom: shadowDomJson,
          lastConsistentShadowDom: this.lastConsistentDomJson,
          lastAction: lastActionInfo
        };
        if (this.inconsistentShadowDomCount < 2) {
          this.firstShadowDomInconsistentEvent = evt;
        } else {
          evt.firstEvent = this.firstShadowDomInconsistentEvent;
          instrument(evt);
        }
      } else {
        this.inconsistentShadowDomCount = 0;
        this.firstShadowDomInconsistentEvent = null;
        this.lastConsistentDomJson = domJson;
      }
    }
  }
}
