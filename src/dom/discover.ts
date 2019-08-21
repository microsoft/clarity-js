import { Event, Token } from "@clarity-types/data";
import { Source } from "@clarity-types/dom";
import { Metric } from "@clarity-types/metric";
import * as task from "@src/core/task";
import queue from "@src/data/queue";
import * as doc from "@src/dom/document";
import encode from "@src/dom/encode";

import processNode from "./node";

export function start(): void {
    discover().then((data: Token[]) => {
        doc.compute();
        queue(data);
      });
}

async function discover(): Promise<Token[]> {
    let timer = Metric.DiscoverTime;
    task.start(timer);
    let walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
    let node = walker.nextNode();
    while (node) {
        if (task.longtask(timer)) { await task.idle(timer); }
        processNode(node, Source.Discover);
        node = walker.nextNode();
    }
    let data = await encode(Event.Discover);
    task.stop(timer);
    return data;
}
