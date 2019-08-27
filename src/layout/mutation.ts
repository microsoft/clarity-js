import { Event, Token } from "@clarity-types/data";
import { Source } from "@clarity-types/layout";
import { Metric } from "@clarity-types/metric";
import * as task from "@src/core/task";
import queue from "@src/data/queue";
import * as boxmodel from "@src/layout/boxmodel";
import * as doc from "@src/layout/document";
import encode from "@src/layout/encode";
import processNode from "./node";

let observer: MutationObserver;
let mutations: MutationRecord[] = [];

export function start(): void {
    if (observer) {
        observer.disconnect();
    }
    observer = window["MutationObserver"] ? new MutationObserver(handle) : null;
    observer.observe(document, { attributes: true, childList: true, characterData: true, subtree: true });
}

export function end(): void {
  observer.disconnect();
  observer = null;
}

function handle(m: MutationRecord[]): void {
  // Queue up mutation records for asynchronous processing
  for (let i = 0; i < m.length; i++) { mutations.push(m[i]); }
  task.schedule(process, done);
}

function done(data: Token[]): void {
  doc.compute();
  boxmodel.compute();
  queue(data);
}

async function process(): Promise<Token[]> {
    let timer = Metric.MutationTime;
    task.start(timer);
    while (mutations.length > 0) {
      let mutation = mutations.shift();
      let target = mutation.target;

      switch (mutation.type) {
        case "attributes":
            if (task.longtask(timer)) { await task.idle(timer); }
            processNode(target, Source.Attributes);
            break;
        case "characterData":
            if (task.longtask(timer)) { await task.idle(timer); }
            processNode(target, Source.CharacterData);
            break;
        case "childList":
          // Process additions
          let addedLength = mutation.addedNodes.length;
          for (let j = 0; j < addedLength; j++) {
            let walker = document.createTreeWalker(mutation.addedNodes[j], NodeFilter.SHOW_ALL, null, false);
            let node = walker.currentNode;
            while (node) {
                if (task.longtask(timer)) { await task.idle(timer); }
                processNode(node, Source.ChildListAdd);
                node = walker.nextNode();
            }
          }
          // Process removes
          let removedLength = mutation.removedNodes.length;
          for (let j = 0; j < removedLength; j++) {
            if (task.longtask(timer)) { await task.idle(timer); }
            processNode(mutation.removedNodes[j], Source.ChildListRemove);
          }
          break;
        default:
          break;
      }
    }
    let data = await encode(Event.Mutation);
    task.stop(timer);
    return data;
}
