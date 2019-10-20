import * as boxmodel from "@src/layout/boxmodel";
import * as discover from "@src/layout/discover";
import * as doc from "@src/layout/document";
import * as dom from "@src/layout/dom";
import * as mutation from "@src/layout/mutation";
import * as target from "@src/layout/target";

export function start(): void {
    doc.reset();
    dom.reset();
    mutation.start();
    discover.start();
    boxmodel.reset();
    target.reset();
}

export function end(): void {
    dom.reset();
    mutation.end();
    boxmodel.reset();
    target.reset();
    doc.reset();
}
