import * as event from "@src/core/event";
import * as task from "@src/core/task";

export let startTime = 0;

export function start(): void {
    startTime = performance.now();
    task.reset();
    event.reset();
}

export function end(): void {
    event.reset();
    task.reset();
    startTime = 0;
}

export function check(): boolean {
    try {
        return typeof Promise !== "undefined" &&
            window["MutationObserver"] &&
            document["createTreeWalker"] &&
            "now" in Date &&
            "now" in performance &&
            typeof WeakMap !== "undefined";
    } catch (ex) {
        return false;
    }
}
