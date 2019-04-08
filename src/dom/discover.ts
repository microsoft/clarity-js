import * as counter from "../instrument/counter";
import { Method } from "../lib/method";
import processNode from "./node";

export default async function(): Promise<void> {
    let method = Method.Discover;
    counter.start(method);
    let walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
    let node = walker.nextNode();
    while (node) {
        if (counter.longtasks(method)) { await counter.idle(method); }
        processNode(node);
        node = walker.nextNode();
    }
    counter.stop(Method.Discover);
}
