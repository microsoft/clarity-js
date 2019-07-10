import { Timer } from "../metrics/enums";
import * as counter from "../metrics/timer";
import processNode from "./node";

let observer: MutationObserver;
window["MUTATIONS"] = [];

export default function(): void {
    console.log("Listening for mutations...");
    if (observer) {
        observer.disconnect();
    }
    observer = window["MutationObserver"] ? new MutationObserver(handle) : null;
    observer.observe(document, { attributes: true, childList: true, characterData: true, subtree: true });
}

function handle(mutations: MutationRecord[]): void {
    let method = Timer.Mutation;
    counter.start(method);
    let length = mutations.length;
    for (let i = 0; i < length; i++) {
      process(mutations[i]);
    }
    counter.stop(method);
}

async function process(mutation: MutationRecord): Promise<void> {
    let method = Timer.Mutation;
    console.log("Received mutation: " + mutation.type + " | " + mutation.target);
    window["MUTATIONS"].push(mutation);

    let target = mutation.target;
    switch (mutation.type) {
      case "attributes":
      case "characterData":
          if (counter.longtasks(method)) { await counter.idle(method); }
          processNode(target);
          break;
      case "childList":
        // Process additions
        let addedLength = mutation.addedNodes.length;
        for (let j = 0; j < addedLength; j++) {
          let walker = document.createTreeWalker(mutation.addedNodes[j], NodeFilter.SHOW_ALL, null, false);
          let node = walker.currentNode;
          while (node) {
              if (counter.longtasks(method)) { await counter.idle(method); }
              processNode(node);
              node = walker.nextNode();
          }
        }
        // Process removes
        let removedLength = mutation.removedNodes.length;
        for (let j = 0; j < removedLength; j++) {
          if (counter.longtasks(method)) { await counter.idle(method); }
          processNode(mutation.removedNodes[j]);
        }
        break;
      default:
        break;
    }
}
