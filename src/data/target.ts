import { Event, TargetData } from "@clarity-types/data";
import encode from "@src/data/encode";
import hash from "@src/data/hash";
import { layout } from "@src/layout/boxmodel";
import * as dom from "@src/layout/dom";

let queue: {[key: number]: TargetData} = {};

export function reset(): void {
    queue = {};
}

export function observe(node: Node): number {
    let id = null;
    if (node !== null) {
        let value = dom.get(node);
        if (value !== null) {
            id = value.id;
            if (id !== null && !(id in queue)) {
                queue[id] = {
                    id,
                    hash: value ? hash(value.selector) : "",
                    box: node && node.nodeType !== Node.TEXT_NODE ? layout(node as Element) : null
                };
            }
        }
    }
    return id;
}

export function updates(): TargetData[] {
    let data: TargetData[] = [];
    for (let id in queue) {
        if (queue[id]) { data.push(queue[id]); }
    }
    reset();
    return data;
}

export function compute(): void {
    encode(Event.Target);
}
