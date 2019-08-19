import * as discover from "@src/dom/discover";
import * as mutation from "@src/dom/mutation";
import * as virtualdom from "@src/dom/virtualdom";

export function start(): void {
    virtualdom.reset();
    mutation.start();
    discover.start();
}

export function end(): void {
    virtualdom.reset();
    mutation.end();
}
