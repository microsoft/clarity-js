import { IEventData, IPlugin } from "@clarity-types/core";
import { Instrumentation, IShadowDomInconsistentEventState } from "@clarity-types/instrumentation";
import {
  Action, IElementLayoutState, ILayoutRoutineInfo, ILayoutState, IMutationRoutineInfo, InsertRuleHandler,
  IShadowDomMutationSummary, IShadowDomNode, IStyleLayoutState, LayoutRoutine, NumberJson, Source
} from "@clarity-types/layout";
import { config } from "@src/config";
import { addEvent, addMultipleEvents, bind, getTimestamp, instrument } from "@src/core";
import { debug, mask, traverseNodeTree } from "@src/utils";
import { ShadowDom } from "./shadowdom";
import { getNodeIndex, NodeIndex } from "./states/generic";
import { resetStateProvider } from "./states/stateprovider";
import { getCssRules } from "./states/style";

export default class Layout implements IPlugin {
  private readonly cssTimeoutLength: number = 50;
  private eventName: string = "Layout";
  private distanceThreshold: number = 5;
  private shadowDom: ShadowDom;
  private inconsistentShadowDomCount: number;
  private observer: MutationObserver;
  private insertRule: InsertRuleHandler;
  private cssTimeout: number;
  private cssElementQueue: Element[];
  private watchList: boolean[];
  private mutationSequence: number;
  private lastConsistentDomJson: NumberJson;
  private firstShadowDomInconsistentEvent: IShadowDomInconsistentEventState;

  public reset(): void {
    this.shadowDom = new ShadowDom();
    this.inconsistentShadowDomCount = 0;
    this.watchList = [];
    this.cssElementQueue = [];
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

      // Some popular open source libraries, like styled-components, optimize performance
      // by injecting CSS using insertRule API vs. appending text node. A side effect of
      // using javascript API is that it doesn't trigger DOM mutation and therefore we
      // need to override the insertRule API and listen for changes manually.
      CSSStyleSheet.prototype.insertRule = function(rule: string, index?: number): number {
        let value = that.insertRule.call(this, rule, index);
        that.queueCss(this.ownerNode);
        return value;
      };
    }
  }

  public teardown(): void {
    if (this.observer) {
      this.observer.disconnect();
    }

    if (this.cssTimeout) {
      clearTimeout(this.cssTimeout);
    }

    // Restore original insertRule definition
    if (this.insertRule) {
      CSSStyleSheet.prototype.insertRule = this.insertRule;
    }
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

  private discoverDom(): void {
    // All 'Discover' events together should be treated as an atomic 'Discover' operation and should have the same timestamp
    const discoverTime = getTimestamp();
    traverseNodeTree(document, (node: Node) => {
      let shadowNode = this.discoverNode(node);
      shadowNode.state.action = Action.Insert;
      shadowNode.state.source = Source.Discover;
      addEvent({
        type: this.eventName,
        state: shadowNode.state,
        time: discoverTime,
      });
    });
    this.checkConsistency({
      action: LayoutRoutine.DiscoverDom
    });
  }

  // Add node to the ShadowDom to store initial adjacent node info in a layout and obtain an index
  private discoverNode(node: Node): IShadowDomNode {
    let shadowNode = this.shadowDom.insertShadowNode(node, getNodeIndex(node.parentNode), getNodeIndex(node.nextSibling));
    shadowNode.computeState();
    this.watch(node, shadowNode.state);
    return shadowNode;
  }

  private watch(node: Node, nodeLayoutState: ILayoutState): void {

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

  private queueCss(element: Element): void {
    // Clear the timeout if it already exists
    if (this.cssTimeout) {
      clearTimeout(this.cssTimeout);
    }

    // Queue element to be processed after the timeout triggers
    if (this.cssElementQueue.indexOf(element) === -1) {
      this.cssElementQueue.push(element);
    }

    this.cssTimeout = window.setTimeout(this.cssDequeue.bind(this), this.cssTimeoutLength);
  }

  private cssDequeue(): void {
    for (let element of this.cssElementQueue) {
      this.layoutHandler(element, Source.Css);
    }
  }

  private layoutHandler(element: Element, source: Source): void {
    let index = getNodeIndex(element);
    let shadowNode = this.shadowDom.getShadowNode(index);
    if (shadowNode) {
      let layoutState = shadowNode.state as IElementLayoutState;
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
          layoutState.attributes.value = mask(input.value);
          layoutState.source = source;
          layoutState.action = Action.Update;
          addEvent({type: this.eventName, state: layoutState});
          break;
        case Source.Css:
          let styleState = shadowNode.state as IStyleLayoutState;
          styleState.cssRules = getCssRules(element as HTMLStyleElement);
          styleState.source = source;
          styleState.action = Action.Update;
          addEvent({type: this.eventName, state: styleState});
          break;
        default:
          break;
      }
    }
  }

  private mutation(mutations: MutationRecord[]): void {

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
    let all: IEventData[] = [].concat(inserts, moves, updates, removes);

    // Since we receive batched mutations and reprocess them after, all mutation events from the same batch
    // should be treated as a single atomic operation, so all of those events should have the same timestamp
    for (let i = 0; i < all.length; i++) {
      all[i].time = time;
    }
    addMultipleEvents(all);
  }

  private processMutation(action: Action, shadowNode: IShadowDomNode): IEventData {
    let state = shadowNode.computeState();
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
