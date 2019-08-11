import { Event, Token } from "@clarity-types/data";
import { Source } from "@clarity-types/dom";
import { Timer } from "@clarity-types/metrics";
import * as task from "@src/core/task";
import time from "@src/core/time";
import queue from "@src/data/queue";
import encode from "@src/dom/encode";
import processNode from "./node";

export function start(): void {
    discover().then((data: Token[]) => {
        queue(time(), Event.Discover, data);
      });
}

async function discover(): Promise<Token[]> {
    let timer = Timer.Discover;
    task.start(timer);
    let walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
    let node = walker.nextNode();
    while (node) {
        if (task.longtask(timer)) { await task.idle(timer); }
        processNode(node, Source.Discover);
        node = walker.nextNode();
    }
    let data = await encode(timer);
    task.stop(timer);
    return data;
}
