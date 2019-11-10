import { Event, Metric } from "@clarity-types/data";
import { Source } from "@clarity-types/layout";
import config from "@src/core/config";
import measure from "@src/core/measure";
import * as task from "@src/core/task";
import * as boxmodel from "@src/layout/boxmodel";
import * as doc from "@src/layout/document";
import encode from "@src/layout/encode";

import processNode from "./node";

export function start(): void {
    task.schedule(discover).then(() => {
        measure(doc.compute)();
        measure(boxmodel.compute)();
    });
}

async function discover(): Promise<void> {
    let timer = Metric.DiscoverLatency;
    task.start(timer);
    let walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
    let node = walker.nextNode();
    while (node) {
        if (task.blocking(timer)) { await task.idle(timer); }
        processNode(node, Source.Discover);
        node = walker.nextNode();
    }
    if (!config.lean) { await encode(Event.Discover); }
    task.stop(timer);
}
