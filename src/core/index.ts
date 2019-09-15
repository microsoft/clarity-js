import * as event from "@src/core/event";

export let startTime = 0;

export function start(): void {
    startTime = performance.now();
    event.reset();
}

export function end(): void {
    event.reset();
    startTime = 0;
}

export function check(): boolean {
    try {
        return typeof Promise !== "undefined" && MutationObserver && document["createTreeWalker"] && "now" in Date && "now" in performance;
    } catch (ex) {
        return false;
    }
}
