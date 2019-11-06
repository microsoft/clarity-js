import { Event, TargetData } from "@clarity-types/data";
import encode from "@src/data/encode";
import hash from "@src/data/hash";
import { layout } from "@src/layout/boxmodel";
import * as dom from "@src/layout/dom";

let queue: {[key: number]: TargetData} = {};

export function reset(): void {
    queue = {};
}

export function observe(id: number): number {
    if (id !== null && !(id in queue)) {
        let value = dom.getValue(id);
        let node = dom.getNode(id) as Element;
        queue[id] = {
            id,
            hash: value ? hash(value.selector) : "",
            box: node && node.nodeType !== Node.TEXT_NODE ? layout(node) : null
        };
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
