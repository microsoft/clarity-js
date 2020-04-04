import { Event, Metric } from "@clarity-types/data";
import { Source } from "@clarity-types/layout";
import measure from "@src/core/measure";
import * as task from "@src/core/task";
import * as scroll from "@src/interaction/scroll";
import * as boxmodel from "@src/layout/boxmodel";
import * as doc from "@src/layout/document";
import encode from "@src/layout/encode";
import * as mutation from "@src/layout/mutation";
import processNode from "./node";

export default async function(root: Node): Promise<void> {
    let timer = Metric.DiscoverDuration;
    task.start(timer);
    observe(root);
    let walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, null, false);
    let node = walker.currentNode;
    while (node) {
        if (task.shouldYield(timer)) { await task.suspend(timer); }
        processNode(node, Source.Discover);
        node = walker.nextNode();
    }
    await encode(Event.Discover);
    task.stop(timer);
    measure(doc.compute)();
    measure(boxmodel.compute)();
}

function observe(root: Node): void {
    mutation.observe(root); // Observe mutations for this root node
    scroll.observe(root); // Observe scroll events for this root node
}
