import { Action, IElementLayoutState, IEventData, ILayoutEventInfo, ILayoutRoutineInfo, ILayoutState, IMutationRoutineInfo,
  Instrumentation, IPlugin, IShadowDomInconsistentEventState, IShadowDomMutationSummary, IShadowDomNode, LayoutRoutine,
  NumberJson, Source } from "../../clarity";
import { config } from "./../config";
import { addEvent, addMultipleEvents, bind, getTimestamp, instrument } from "./../core";
import { debug, isNumber, traverseNodeTree } from "./../utils";
import { ShadowDom } from "./layout/shadowdom";
import { createGenericLayoutState, createIgnoreLayoutState, createLayoutState } from "./layout/stateprovider";
import { getLayoutState, getNodeIndex, NodeIndex, resetStateProvider } from "./layout/stateprovider";

export default class Layout implements IPlugin {
  private eventName = "Layout";
  private distanceThreshold = 5;
  private shadowDom: ShadowDom;
  private inconsistentShadowDomCount: number;
  private observer: MutationObserver;
  private watchList: boolean[];
  private mutationSequence: number;
  private domPreDiscoverMutations: ILayoutEventInfo[][];
  private lastConsistentDomJson: NumberJson;
  private firstShadowDomInconsistentEvent: IShadowDomInconsistentEventState;
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
    this.domPreDiscoverMutations = [];
    this.lastConsistentDomJson = null;
    this.firstShadowDomInconsistentEvent = null;
    this.originalLayouts = [];
    resetStateProvider();
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
    traverseNodeTree(document, (node: Node) => {
      let layoutState = this.discoverNode(node);
      layoutState.action = Action.Insert;
      layoutState.source = Source.Discover;
      addEvent({
        type: this.eventName,
        state: layoutState
      });
    });
    this.checkConsistency({
      action: LayoutRoutine.DiscoverDom
    });
  }

  // Add node to the ShadowDom to store initial adjacent node info in a layout and obtain an index
  private discoverNode(node: Node): ILayoutState {
    this.shadowDom.insertShadowNode(node, getNodeIndex(node.parentNode), getNodeIndex(node.nextSibling));
    return createLayoutState(node);
  }

  private processMultipleNodeEvents<T extends ILayoutEventInfo>(eventInfos: T[]) {
    let eventsData: IEventData[] = [];
    for (let i = 0; i < eventInfos.length; i++) {
      let eventState = this.createEventState(eventInfos[i]);
      eventsData.push({
        type: this.eventName,
        state: eventState
      });
    }
    addMultipleEvents(eventsData);
  }

  private createEventState<T extends ILayoutEventInfo>(eventInfo: T): ILayoutState {
    let node = eventInfo.node;
    let layoutState: ILayoutState = createLayoutState(node);

    switch (eventInfo.action) {
      case Action.Insert:
        // Watch element for scroll and input change events
        this.watch(node, layoutState);
        layoutState.action = Action.Insert;
        break;
      case Action.Update:
        // Watch element for scroll and input change events
        this.watch(node, layoutState);
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
    return layoutState;
  }

  private watch(node: Node, nodeLayoutState: ILayoutState) {

    // We only wish to watch elements once and then wait on the events to push changes
    if (node.nodeType !== Node.ELEMENT_NODE || this.watchList[nodeLayoutState.index]) {
      return;
    }

    let element = node as Element;
    let layoutState = nodeLayoutState as IElementLayoutState;
    let scrollPossible = (layoutState.layout
                          && ("scrollX" in layoutState.layout
                          || "scrollY" in layoutState.layout));

    if (scrollPossible) {
      bind(element, "scroll", this.layoutHandler.bind(this, element, Source.Scroll));
      this.watchList[layoutState.index] = true;
    }

    // Check if we need to monitor changes on input fields
    if (element.tagName === "INPUT" || element.tagName === "SELECT") {
      bind(element, "change", this.layoutHandler.bind(this, element, Source.Input));
      this.watchList[layoutState.index] = true;
    } else if (element.tagName === "TEXTAREA") {
      bind(element, "input", this.layoutHandler.bind(this, element, Source.Input));
      this.watchList[layoutState.index] = true;
    }
  }

  private layoutHandler(element: Element, source: Source) {
    let index = getNodeIndex(element);
    let recordEvent = true;
    if (index !== null) {
      let time = getTimestamp();
      let layoutState = <IElementLayoutState> getLayoutState(index);

      if (!layoutState) {
        return;
      }

      switch (source) {
        case Source.Scroll:
          let scrollX = Math.round(element.scrollLeft);
          let scrollY = Math.round(element.scrollTop);
          let dx = layoutState.layout.scrollX - scrollX;
          let dy = layoutState.layout.scrollY - scrollY;
          if (dx * dx + dy * dy > this.distanceThreshold * this.distanceThreshold) {
            layoutState.source = source;
            layoutState.action = Action.Update;
            layoutState.layout.scrollX = scrollX;
            layoutState.layout.scrollY = scrollY;
            addEvent({type: this.eventName, state: layoutState});
          }
          break;
        case Source.Input:
          let input = element as HTMLInputElement;
          layoutState.attributes.value = config.showText ? input.value : input.value.replace(/./g, "*");
          layoutState.source = source;
          layoutState.action = Action.Update;
          addEvent({type: this.eventName, state: layoutState});
          break;
        default:
          break;
      }
    }
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
        this.processMultipleNodeEvents(events);
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
