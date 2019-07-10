import { Timer } from "../metrics/enums";
import * as timer from "../metrics/timer";
import processNode from "./node";

export default async function(): Promise<void> {
    let method = Timer.Discover;
    timer.start(method);
    let walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL, null, false);
    let node = walker.nextNode();
    while (node) {
        if (timer.longtasks(method)) { await timer.idle(method); }
        processNode(node);
        node = walker.nextNode();
    }
    console.log("Finished discovering");
    timer.stop(method);
}
