import { Event } from "@clarity-types/data";
import { TargetQueue } from "@clarity-types/layout";
import config from "@src/core/config";
import time from "@src/core/time";
import hash from "@src/data/hash";
import { layout } from "@src/layout/boxmodel";
import encode from "@src/layout/encode";
import * as dom from "./dom";

export let queue: TargetQueue = null;
let timeout: number = null;

export function reset(): void {
    queue = { ids: [], data: [], time: null };
    clearTimeout(timeout);
    timeout = null;
}

export function observe(id: number, t: number = time()): void {
    queue.time = queue.time ? queue.time : t;
    if (queue.ids.indexOf(id) === -1) { queue.ids.push(id); }
    clearTimeout(timeout);
    timeout = window.setTimeout(compute, config.lookahead);
}

function compute(): void {
    let doc = document.documentElement;
    let x = "pageXOffset" in window ? window.pageXOffset : doc.scrollLeft;
    let y = "pageYOffset" in window ? window.pageYOffset : doc.scrollTop;

    // Process all layout computations in single batch to avoid reflows
    for (let id of queue.ids) {
        let value = dom.getValue(id);
        let node = dom.getNode(id) as Element;
        queue.data.push({
            id,
            hash: value ? hash(value.selector) : "",
            box: node ? layout(node, x, y) : []
        });
    }

    if (queue.data.length > 0) { encode(Event.Target); }
}
