import { Priority } from "@clarity-types/core";
import { Code, Event, Metric } from "@clarity-types/data";
import { Source } from "@clarity-types/layout";
import measure from "@src/core/measure";
import * as task from "@src/core/task";
import * as internal from "@src/diagnostic/internal";
import * as boxmodel from "@src/layout/boxmodel";
import * as doc from "@src/layout/document";
import * as dom from "@src/layout/dom";
import encode from "@src/layout/encode";
import traverse from "@src/layout/traverse";
import processNode from "./node";

let observers: MutationObserver[] = [];
let mutations: MutationRecord[] = [];
let insertRule: (rule: string, index?: number) => number = null;
let deleteRule: (index?: number) => void = null;

export function start(): void {
    observers = [];

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

export function observe(node: Node): void {
  // Create a new observer for every time a new DOM tree (e.g. root document or shadowdom root) is discovered on the page
  // In the case of shadow dom, any mutations that happen within the shadow dom are not bubbled up to the host document
  // For this reason, we need to wire up mutations everytime we see a new shadow dom.
  // Also, wrap it inside a try / catch. In certain browsers (e.g. legacy Edge), observer on shadow dom can throw errors
  try {
    let observer = window["MutationObserver"] ? new MutationObserver(measure(handle) as MutationCallback) : null;
    observer.observe(node, { attributes: true, childList: true, characterData: true, subtree: true });
    observers.push(observer);
  } catch (error) { internal.error(Code.MutationObserver, error); }
}

export function end(): void {
  for (let observer of observers) { if (observer) { observer.disconnect(); } }
  observers = [];

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
  task.schedule(process, Priority.High).then((): void => {
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
            dom.extractRegions(target as HTMLElement);
            processNode(target, Source.Attributes);
            break;
        case "characterData":
            if (task.shouldYield(timer)) { await task.suspend(timer); }
            dom.extractRegions(target as HTMLElement);
            processNode(target, Source.CharacterData);
            break;
        case "childList":
          // Process additions
          let addedLength = mutation.addedNodes.length;
          for (let j = 0; j < addedLength; j++) {
            let addedNode = mutation.addedNodes[j];
            dom.extractRegions(addedNode as HTMLElement);
            traverse(addedNode, timer, Source.ChildListAdd);
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
