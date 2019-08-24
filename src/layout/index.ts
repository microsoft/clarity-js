import * as discover from "@src/layout/discover";
import * as dom from "@src/layout/dom";
import * as mutation from "@src/layout/mutation";

export function start(): void {
    dom.reset();
    mutation.start();
    discover.start();
}

export function end(): void {
    dom.reset();
    mutation.end();
}
