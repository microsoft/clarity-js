import { Event, TargetData } from "@clarity-types/data";
import encode from "@src/data/encode";
import hash from "@src/data/hash";
import { layout } from "@src/layout/boxmodel";
import * as dom from "@src/layout/dom";

let queue: number[] = [];

export function reset(): void {
    queue = [];
}

export function observe(id: number): number {
    if (id !== null && queue.indexOf(id) === -1) {
        queue.push(id);
    }
    return id;
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
                box: node && node.nodeType !== Node.TEXT_NODE ? layout(node, x, y) : []
            });
        }
        reset();
    }
    return data;
}

export function compute(): void {
    encode(Event.Target);
}
