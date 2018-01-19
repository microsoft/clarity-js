import { Action, IElementLayoutState, IEventData, ILayoutEventInfo, ILayoutRoutineInfo, ILayoutState, IMutationRoutineInfo,
  Instrumentation, IPlugin, IShadowDomInconsistentEventState, IShadowDomMutationSummary, IShadowDomNode, LayoutRoutine,
  NumberJson, Source } from "../../clarity";
import { config } from "../config";
import { addEvent, addMultipleEvents, bind, getTimestamp, instrument } from "../core";
import { debug, isNumber, traverseNodeTree } from "../utils";
import * as EventProvider from "./layout/eventprovider";
import { ShadowDom } from "./layout/shadowdom";
import StateManager from "./layout/statemanager";
import { getElementAttributes, getElementLayoutRectangle } from "./layout/stateprovider";
import { createGenericLayoutState, createIgnoreLayoutState, createLayoutState } from "./layout/stateprovider";
import { getNodeIndex, IgnoreTag, NodeIndex, shouldIgnoreNode } from "./layout/stateprovider";

export default class Layout implements IPlugin {
  private distanceThreshold = 5;
  private shadowDom: ShadowDom;
  private states: StateManager;
  private inconsistentShadowDomCount: number;
  private observer: MutationObserver;
  private watchList: boolean[];
  private mutationSequence: number;
  private lastConsistentDomJson: NumberJson;
  private firstShadowDomInconsistentEvent: IShadowDomInconsistentEventData;

  public reset(): void {
    this.shadowDom = new ShadowDom();
    this.states = new StateManager();
    this.inconsistentShadowDomCount = 0;
    this.watchList = [];
    this.observer = window["MutationObserver"] ? new MutationObserver(this.mutation.bind(this)) : null;
    this.mutationSequence = 0;
    this.lastConsistentDomJson = null;
    this.firstShadowDomInconsistentEvent = null;
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

  private discoverDom() {
    let discoverTime = getTimestamp();
    this.discover(document, this.shadowDom, this.states);

    let discover: IDiscover = {
      dom: treeToDiscoverArray(document, this.states)
    };

    let discoverEventData: IEventInfo = {
      origin: Origin.Discover,
      type: DiscoverEventType.Discover,
      data: discover
    };
    addEvent(discoverEventData);

    this.checkConsistency({
      action: LayoutRoutine.DiscoverDom
    });
  }

  private discover(root: Node, shadowDom: ShadowDom, states: StateManager): void {
    let children = root.childNodes;
    let state = this.discoverNode(root, shadowDom);
    states.add(state);
    for (let i = 0; i < children.length; i++) {
      this.discover(children[i], shadowDom, states);
    }
  }

  // Add node to the ShadowDom to store initial adjacent node info in a layout and obtain an index
  private discoverNode(node: Node, shadowDom: ShadowDom): ILayoutState {
    shadowDom.insertShadowNode(node, getNodeIndex(node.parentNode), getNodeIndex(node.nextSibling));
    return createLayoutState(node, shadowDom);
  }

  private processMultipleNodeEvents<T extends ILayoutEventInfo>(eventInfos: T[]) {
    let eventsData: IEventInfo[] = [];
    for (let i = 0; i < eventInfos.length; i++) {
      let eventData = this.createEvent(eventInfos[i]);
      if (eventData) {
        eventsData.push({
          origin: Origin.Layout,
          type: eventInfos[i].action,
          data: eventData,
        });
      }
    }
    addMultipleEvents(eventsData);
  }

  private createEvent<T extends ILayoutEventInfo>(eventInfo: T): ILayoutEventData {
    let event: ILayoutEventData = null;
    let index = eventInfo.index;
    switch (eventInfo.action) {
      case Action.Insert:
        let insertedElement = eventInfo.node as Element;
        let insertEvent = event = EventProvider.createInsert(insertedElement, this.shadowDom, this.mutationSequence);
        this.states.add(insertEvent.state);
        // Watch element for scroll and input change events
        this.watch(insertedElement);
        break;
      case Action.Remove:
        // Index is passed explicitly because indices on removed nodes are cleared,
        // so at this point we can't obtain node's index from the node itself
        event = EventProvider.createRemove(index, this.mutationSequence);
        break;
      case Action.Move:
        let movedNode = eventInfo.node;
        event = EventProvider.createMove(movedNode, this.mutationSequence);
        break;
      case Action.AttributeUpdate:
        let previousElementState = this.states.get(index) as IElementLayoutState;
        let updatedElement = eventInfo.node as Element;
        if (previousElementState.tag !== IgnoreTag) {
          let currentAttributes = getElementAttributes(updatedElement);
          let currentLayout = getElementLayoutRectangle(updatedElement);
          event = EventProvider.createAttributeUpdate(updatedElement, previousElementState, this.mutationSequence);
          previousElementState.attributes = currentAttributes;
          previousElementState.layout = currentLayout;
        }
        // Watch element for scroll and input change events
        this.watch(updatedElement);
        break;
      case Action.CharacterDataUpdate:
        let previousTextState = this.states.get(index) as ITextLayoutState;
        let updatedNode = eventInfo.node as CharacterDataNode;
        event = EventProvider.createCharacterDataUpdate(updatedNode, previousTextState.content , this.mutationSequence);
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

    let layoutState = this.states.get(index) as IElementLayoutState;
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
    let layoutState = this.states.get(index) as IElementLayoutState;
    let event = EventProvider.createScroll(element);
    let newScrollX = Math.round(element.scrollLeft);
    let newScrollY = Math.round(element.scrollTop);
    if (this.checkDistance(layoutState.layout.scrollX, layoutState.layout.scrollY, event.scrollX, event.scrollY)) {
      layoutState.layout.scrollX = newScrollX;
      layoutState.layout.scrollY = newScrollY;
      addEvent({origin: Origin.Layout, type: Action.Scroll, data: event });
    }
  }

  private onInput(inputElement: InputElement) {
    let event = EventProvider.createInput(inputElement);
    (this.states.get(getNodeIndex(inputElement)) as IInputLayoutState).value  = event.value;
    addEvent({origin: Origin.Layout, type: Action.Input, data: event});
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
        let evt: IShadowDomInconsistentEventData = {
          dom: domJson,
          shadowDom: shadowDomJson,
          lastConsistentShadowDom: this.lastConsistentDomJson,
          lastAction: lastActionInfo
        };
        if (this.inconsistentShadowDomCount < 2) {
          this.firstShadowDomInconsistentEvent = evt;
        } else {
          evt.firstEvent = this.firstShadowDomInconsistentEvent;
          instrument(Instrumentation.ShadowDomInconsistent, evt);
        }
      } else {
        this.inconsistentShadowDomCount = 0;
        this.firstShadowDomInconsistentEvent = null;
        this.lastConsistentDomJson = domJson;
      }
    }
  }
}
