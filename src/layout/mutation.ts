import { Priority } from "@clarity-types/core";
import { Event, Metric } from "@clarity-types/data";
import { Source } from "@clarity-types/layout";
import measure from "@src/core/measure";
import * as task from "@src/core/task";
import * as boxmodel from "@src/layout/boxmodel";
import * as doc from "@src/layout/document";
import * as dom from "@src/layout/dom";
import encode from "@src/layout/encode";
import processNode from "./node";

let observer: MutationObserver;
let mutations: MutationRecord[] = [];
let insertRule: (rule: string, index?: number) => number = null;
let deleteRule: (index?: number) => void = null;

export function start(): void {
    if (observer) { observer.disconnect(); }
    observer = window["MutationObserver"] ? new MutationObserver(measure(handle) as MutationCallback) : null;
    observer.observe(document, { attributes: true, childList: true, characterData: true, subtree: true });
    if (insertRule === null) { insertRule = CSSStyleSheet.prototype.insertRule; }
    if (deleteRule === null) { deleteRule = CSSStyleSheet.prototype.deleteRule; }

    // Some popular open source libraries, like styled-components, optimize performance
    // by injecting CSS using insertRule API vs. appending text node. A side effect of
    // using javascript API is that it doesn't trigger DOM mutation and therefore we
    // need to override the insertRule API and listen for changes manually.
    CSSStyleSheet.prototype.insertRule = function(rule: string, index?: number): number {
      let value = insertRule.call(this, rule, index);
      generate(this.ownerNode, "characterData");
      return value;
    };

    CSSStyleSheet.prototype.deleteRule = function(index?: number): void {
      deleteRule.call(this, index);
      generate(this.ownerNode, "characterData");
    };
}

export function end(): void {
  if (observer) { observer.disconnect(); }
  observer = null;

  // Restoring original insertRule
  if (insertRule !== null) {
    CSSStyleSheet.prototype.insertRule = insertRule;
    insertRule = null;
  }

  // Restoring original deleteRule
  if (deleteRule !== null) {
    CSSStyleSheet.prototype.deleteRule = deleteRule;
    deleteRule = null;
  }

  mutations = [];
}

function handle(m: MutationRecord[]): void {
  // Queue up mutation records for asynchronous processing
  for (let i = 0; i < m.length; i++) { mutations.push(m[i]); }
  task.schedule(process, Priority.High).then(() => {
      measure(doc.compute)();
      measure(boxmodel.compute)();
  });
}

async function process(): Promise<void> {
    let timer = Metric.MutationDuration;
    task.start(timer);
    while (mutations.length > 0) {
      let mutation = mutations.shift();
      let target = mutation.target;

      switch (mutation.type) {
        case "attributes":
            if (task.shouldYield(timer)) { await task.suspend(timer); }
            dom.regions(target as HTMLElement);
            processNode(target, Source.Attributes);
            break;
        case "characterData":
            if (task.shouldYield(timer)) { await task.suspend(timer); }
            dom.regions(target as HTMLElement);
            processNode(target, Source.CharacterData);
            break;
        case "childList":
          // Process additions
          let addedLength = mutation.addedNodes.length;
          for (let j = 0; j < addedLength; j++) {
            let addedNode = mutation.addedNodes[j];
            dom.regions(addedNode as HTMLElement);
            // In IE11, walker.nextNode() throws an error if walker.currentNode is a text node
            // To keep things simple, we fork the code path for text nodes in all browser
            if (addedNode.nodeType === Node.TEXT_NODE) {
              processNode(addedNode, Source.ChildListAdd);
            } else {
              let walker = document.createTreeWalker(addedNode, NodeFilter.SHOW_ALL, null, false);
              let node = walker.currentNode;
              while (node) {
                  if (task.shouldYield(timer)) { await task.suspend(timer); }
                  processNode(node, Source.ChildListAdd);
                  node = walker.nextNode();
              }
            }
          }
          // Process removes
          let removedLength = mutation.removedNodes.length;
          for (let j = 0; j < removedLength; j++) {
            if (task.shouldYield(timer)) { await task.suspend(timer); }
            processNode(mutation.removedNodes[j], Source.ChildListRemove);
          }
          break;
        default:
          break;
      }
    }
    await encode(Event.Mutation);
    task.stop(timer);
}

function generate(target: Node, type: MutationRecordType): void {
  measure(handle)([{
    addedNodes: null,
    attributeName: null,
    attributeNamespace: null,
    nextSibling: null,
    oldValue: null,
    previousSibling: null,
    removedNodes: null,
    target,
    type
  }]);
}
