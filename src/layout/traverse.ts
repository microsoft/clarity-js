import { Metric } from "@clarity-types/data";
import { Source } from "@clarity-types/layout";
import * as task from "@src/core/task";
import processNode from "./node";

export default async function(root: Node, timer: Metric, source: Source): Promise<void> {
    let queue = [root];
    while (queue.length > 0) {
        let node = queue.shift();
        let next = node.firstChild;
        if (node.nodeType === Node.ELEMENT_NODE && node["shadowRoot"]) {
            queue.push((node as HTMLElement).shadowRoot);
        }
        while (next) {
            queue.push(next);
            next = next.nextSibling;
        }
        if (task.shouldYield(timer)) { await task.suspend(timer); }
        processNode(node, source);
    }
}
