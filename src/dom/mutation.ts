import { Event, Token } from "@clarity-types/data";
import { Source } from "@clarity-types/dom";
import { Metric } from "@clarity-types/metric";
import * as task from "@src/core/task";
import queue from "@src/data/queue";
import encode from "@src/dom/encode";
import processNode from "./node";

let observer: MutationObserver;

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

function handle(mutations: MutationRecord[]): void {
    process(mutations).then((data: Token[]) => {
      queue(data);
    });
}

async function process(mutations: MutationRecord[]): Promise<Token[]> {
    let timer = Metric.MutationTime;
    task.start(timer);
    let length = mutations.length;
    for (let i = 0; i < length; i++) {
      let mutation = mutations[i];
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
