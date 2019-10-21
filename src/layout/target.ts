import { Event } from "@clarity-types/data";
import { TargetData } from "@clarity-types/layout";
import config from "@src/core/config";
import hash from "@src/data/hash";
import { layout } from "@src/layout/boxmodel";
import encode from "@src/layout/encode";
import * as dom from "./dom";

let queue: number[] = [];
let timeout: number = null;

export function reset(): void {
    queue = [];
    clearTimeout(timeout);
    timeout = null;
}

export function observe(id: number): void {
    if (queue.indexOf(id) === -1) { queue.push(id); }
    clearTimeout(timeout);
    timeout = window.setTimeout(encode, config.lookahead, Event.Target);
}

export function updates(): TargetData[] {
    let data: TargetData[] = [];
    if (queue.length > 0) {
        let doc = document.documentElement;
        let x = "pageXOffset" in window ? window.pageXOffset : doc.scrollLeft;
        let y = "pageYOffset" in window ? window.pageYOffset : doc.scrollTop;

        // Process all layout computations in single batch to avoid reflows
        for (let id of queue) {
            let value = dom.getValue(id);
            let node = dom.getNode(id) as Element;
            data.push({
                id,
                hash: value ? hash(value.selector) : "",
                box: node ? layout(node, x, y) : []
            });
        }
        reset();
    }
    return data;
}
