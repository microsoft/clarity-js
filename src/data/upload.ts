import { Event, Flush, IEvent, Token } from "@clarity-types/data";
import * as metrics from "@src/metrics/metrics";
import * as document from "@src/viewport/document";

let events: IEvent[] = [];
let wait = 1000;
let timeout: number = null;

window["PAYLOAD"] = [];

export function queue(timestamp: number, event: Event, data: Token[], flush: Flush = Flush.Schedule): void {
    events.push({
        t: timestamp,
        e: event,
        d: data
    });

    switch (flush) {
        case Flush.Schedule:
            clearTimeout(timeout);
            timeout = window.setTimeout(send, wait);
            break;
        case Flush.Force:
            clearTimeout(timeout);
            send();
            break;
    }
}

function send(): void {
    document.compute();
    metrics.compute();

    let json = JSON.stringify(events);
    events = [];
    console.log("Json: " + json);
    window["PAYLOAD"].push(json);
}
