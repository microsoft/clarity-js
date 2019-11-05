import { Event, Metric } from "@clarity-types/data";
import { Source } from "@clarity-types/layout";
import config from "@src/core/config";
import * as task from "@src/core/task";
import * as boxmodel from "@src/layout/boxmodel";
import * as doc from "@src/layout/document";
import encode from "@src/layout/encode";

import processNode from "./node";

export function start(): void {
    task.schedule(discover).then(() => {
        doc.compute();
        boxmodel.compute();
    });
}

async function discover(): Promise<void> {
    let timer = Metric.DiscoverTime;
    task.start(timer);
    let walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
    let node = walker.nextNode();
    while (node) {
        if (task.longtask(timer)) { await task.idle(timer); }
        processNode(node, Source.Discover);
        node = walker.nextNode();
    }
    if (!config.lean) { await encode(Event.Discover); }
    task.stop(timer);
}
