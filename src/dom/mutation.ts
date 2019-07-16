import { Event, Token } from "@clarity-types/data";
import { Timer } from "@clarity-types/metrics";
import { time } from "@src/clarity";
import { queue } from "@src/data/upload";
import serialize from "@src/dom/serialize";
import * as timer from "@src/metrics/timer";
import processNode from "./node";

let observer: MutationObserver;
window["MUTATIONS"] = [];

export function start(): void {
    console.log("Listening for mutations...");
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
      queue(time(), Event.Mutation, data);
    });
}

async function process(mutations: MutationRecord[]): Promise<Token[]> {
    let method = Timer.Mutation;
    timer.start(method);
    let length = mutations.length;
    for (let i = 0; i < length; i++) {
      let mutation = mutations[i];
      let target = mutation.target;

      console.log("Received mutation: " + mutation.type + " | " + mutation.target);
      window["MUTATIONS"].push(mutation);

      switch (mutation.type) {
        case "attributes":
        case "characterData":
            if (timer.longtasks(method)) { await timer.idle(method); }
            processNode(target);
            break;
        case "childList":
          // Process additions
          let addedLength = mutation.addedNodes.length;
          for (let j = 0; j < addedLength; j++) {
            let walker = document.createTreeWalker(mutation.addedNodes[j], NodeFilter.SHOW_ALL, null, false);
            let node = walker.currentNode;
            while (node) {
                if (timer.longtasks(method)) { await timer.idle(method); }
                processNode(node);
                node = walker.nextNode();
            }
          }
          // Process removes
          let removedLength = mutation.removedNodes.length;
          for (let j = 0; j < removedLength; j++) {
            if (timer.longtasks(method)) { await timer.idle(method); }
            processNode(mutation.removedNodes[j]);
          }
          break;
        default:
          break;
      }
    }
    let data = await serialize(method);
    timer.stop(method);
    return data;
}
