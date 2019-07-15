import { Event, Token } from "@clarity-types/data";
import { Timer } from "@clarity-types/metrics";
import { time } from "@src/core";
import { queue } from "@src/data/upload";
import serialize from "@src/dom/serialize";
import * as timer from "@src/metrics/timer";
import processNode from "./node";

export default function(): void {
    discover().then((data: Token[]) => {
        queue(time(), Event.Discover, data);
      });
}

async function discover(): Promise<Token[]> {
    let method = Timer.Discover;
    timer.start(method);
    let walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
    let node = walker.nextNode();
    while (node) {
        if (timer.longtasks(method)) { await timer.idle(method); }
        processNode(node);
        node = walker.nextNode();
    }
    console.log("Finished discovering");
    let data = await serialize(method);
    timer.stop(method);
    return data;
}
