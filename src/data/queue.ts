import { Flush, Token } from "@clarity-types/data";
import config from "@src/core/config";
import upload from "@src/data/upload";

let events: Token[][] = [];
let timeout: number = null;

window["PAYLOAD"] = [];

export default function(data: Token[], flush: Flush = Flush.Schedule): void {
    events.push(data);

    switch (flush) {
        case Flush.Schedule:
            clearTimeout(timeout);
            timeout = window.setTimeout(dequeue, config.delay);
            break;
        case Flush.Force:
            clearTimeout(timeout);
            dequeue();
            break;
    }
}

function dequeue(): void {
    upload(events);
    reset();
}

function reset(): void {
    events = [];
}
