import { Event, TargetData, TargetInfo } from "@clarity-types/data";
import encode from "@src/data/encode";
import hash from "@src/data/hash";
import { layout } from "@src/layout/boxmodel";
import * as dom from "@src/layout/dom";

let queue: {[key: number]: TargetData} = {};

export function reset(): void {
    queue = {};
}

export function track(node: Node): TargetInfo {
    let id = null;
    let selector = null;
    let region = null;
    if (node) {
        let value = dom.get(node);
        if (value !== null) {
            id = value.id;
            selector = value.selector;
            region = value.region;
        }
    }
    return { id, selector, node, region };
}

export function observe(target: TargetInfo): number {
    let value = target.node ? dom.get(target.node) : null;
    let id = target.id === null && value ? value.id : target.id;
    let selector = value && !target.selector ? value.selector : target.selector;
    let region = value && !target.region ? value.region : target.region;

    if (id !== null && !(id in queue)) {
        queue[id] = {
            id,
            hash: selector ? hash(selector) : "",
            region: region ? region : "",
            box: target.node && target.node.nodeType !== Node.TEXT_NODE ? layout(target.node as Element) : null
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
