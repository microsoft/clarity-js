import { Action, IElementLayoutState, IEventData, ILayoutRoutineInfo, ILayoutState, IMutationRoutineInfo,
  INodeInfo, Instrumentation, IPlugin, IShadowDomInconsistentEventState, IShadowDomMutationSummary, IShadowDomNode, IStyleLayoutState,
  LayoutRoutine, NumberJson, Source } from "../../types/index";
import { config } from "./../config";
import { addEvent, addMultipleEvents, bind, getTimestamp, instrument } from "./../core";
import { debug, mask, traverseNodeTree } from "./../utils";
import { ShadowDom } from "./layout/shadowdom";
import { getNodeIndex, NodeIndex, resetStateProvider } from "./layout/stateprovider";

export default class Layout implements IPlugin {
  private eventName = "Layout";
  private distanceThreshold = 5;
  private shadowDom: ShadowDom;
  private inconsistentShadowDomCount: number;
  private observer: MutationObserver;
  private insertRule;
  private watchList: boolean[];
  private mutationSequence: number;
  private lastConsistentDomJson: NumberJson;
  private firstShadowDomInconsistentEvent: IShadowDomInconsistentEventState;

  public reset(): void {
    this.shadowDom = new ShadowDom();
    this.inconsistentShadowDomCount = 0;
    this.watchList = [];
    this.observer = window["MutationObserver"] ? new MutationObserver(this.mutation.bind(this)) : null;
    this.insertRule = CSSStyleSheet.prototype.insertRule;
    this.mutationSequence = 0;
    this.lastConsistentDomJson = null;
    this.firstShadowDomInconsistentEvent = null;
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
    if (this.insertRule) {
      let that = this;
      CSSStyleSheet.prototype.insertRule = function(style, index) {
        let value = that.insertRule.call(this, style, index);
        that.layoutHandler(this.ownerNode, Source.Css);
        return value;
      };
    }
  }

  public teardown(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    // Restore original insertRule definition
    CSSStyleSheet.prototype.insertRule = this.insertRule;
    this.insertRule = null;

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
    traverseNodeTree(document, (node: Node) => {
      let nodeInfo = this.discoverNode(node);
      nodeInfo.state.action = Action.Insert;
      nodeInfo.state.source = Source.Discover;
      addEvent({
        type: this.eventName,
        state: nodeInfo.state
      });
    });
    this.checkConsistency({
      action: LayoutRoutine.DiscoverDom
    });
  }

  // Add node to the ShadowDom to store initial adjacent node info in a layout and obtain an index
  private discoverNode(node: Node): INodeInfo {
    let shadowNode = this.shadowDom.insertShadowNode(node, getNodeIndex(node.parentNode), getNodeIndex(node.nextSibling));
    return this.computeInfo(shadowNode);
  }

  private computeInfo(shadowNode) {
    let info = shadowNode.computeInfo();
    if ((shadowNode.node as Element).tagName === "STYLE" && shadowNode.node.textContent.length === 0) {
      info.state.cssRules = this.cssRules(shadowNode.node as Element);
    }
    return info;
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
    let nodeInfo = this.shadowDom.getNodeInfo(index);
    if (nodeInfo) {
      let layoutState = nodeInfo.state as IElementLayoutState;
      let styleState = nodeInfo.state as IStyleLayoutState;
      switch (source) {
        case Source.Scroll:
          layoutState = layoutState as IElementLayoutState;
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
          layoutState = layoutState as IElementLayoutState;
          let input = element as HTMLInputElement;
          let showText = config.showText && !nodeInfo.forceMask;
          layoutState.attributes.value = showText ? input.value : mask(input.value);
          layoutState.source = source;
          layoutState.action = Action.Update;
          addEvent({type: this.eventName, state: layoutState});
          break;
        case Source.Css:
          styleState.cssRules = this.cssRules(element);
          styleState.source = source;
          styleState.action = Action.Update;
          addEvent({type: this.eventName, state: styleState});
          break;
        default:
          break;
      }
    }
  }

  private cssRules(element: Element) {
    let cssRules = null;

    let rules = [];
    // Firefox throws a SecurityError when trying to access cssRules of a stylesheet from a different domain
    try {
      let sheet = (element as HTMLStyleElement).sheet as CSSStyleSheet;
      cssRules = sheet ? sheet.cssRules : [];
    } catch (e) {
      if (e.name !== "SecurityError") {
        throw e;
      }
    }

    if (cssRules !== null) {
      rules = [];
      for (let i = 0; i < cssRules.length; i++) {
        rules.push(cssRules[i].cssText);
      }
    }

    return rules;
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
        this.processMutations(summary, time);
      }
    }

    this.mutationSequence++;
  }

  private allowMutation(): boolean {
    return this.inconsistentShadowDomCount < 2 || !config.validateConsistency;
  }

  private processMutations(summary: IShadowDomMutationSummary, time: number): void {
    let inserts = summary.newNodes.map(this.processMutation.bind(this, Action.Insert));
    let moves = summary.movedNodes.map(this.processMutation.bind(this, Action.Move));
    let updates = summary.updatedNodes.map(this.processMutation.bind(this, Action.Update));
    let removes = summary.removedNodes.map(this.processMutation.bind(this, Action.Remove));
    let all = [].concat(inserts, moves, updates, removes);
    addMultipleEvents(all);
  }

  private processMutation(action: Action, shadowNode: IShadowDomNode): IEventData {
    let info = this.computeInfo(shadowNode);
    let state = info.state;
    state.action = action;
    state.source = Source.Mutation;
    state.mutationSequence = this.mutationSequence;

    // Watch new or updated nodes
    if (action === Action.Insert || action === Action.Update) {
      this.watch(shadowNode.node, state);
    } else if (action === Action.Remove) {
      // Removed nodes don't have an index any more, so computed state index will be null,
      // however its original index can still be obtained from its matching shadow node id
      state.index = parseInt(shadowNode.id, 10);
    }

    return { type: this.eventName, state };
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
        debug(`>>> ShadowDom doesn't match PageDOM after mutation batch #${this.mutationSequence}!`);
      } else {
        this.inconsistentShadowDomCount = 0;
        this.firstShadowDomInconsistentEvent = null;
        this.lastConsistentDomJson = domJson;
      }
    }
  }
}
