import { Event, Flush, IEventQueue, Token } from "@clarity-types/data";
import config from "@src/core/config";
import upload from "@src/data/upload";
import recompute from "../core/recompute";

let events: IEventQueue = { server: [], client: [] };
let timeout: number = null;

window["PAYLOAD"] = [];

export default function(timestamp: number, event: Event, data: Token[], flush: Flush = Flush.Schedule): void {
    let e = {t: timestamp, e: event, d: data};

    switch (event) {
        case Event.Mouse:
        case Event.Touch:
        case Event.Keyboard:
        case Event.Selection:
        case Event.Resize:
        case Event.Scroll:
        case Event.Document:
        case Event.Visibility:
            events.server.push(e);
            break;
        default:
            events.client.push(e);
            break;
    }

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
    recompute();
    upload(events);
    reset();
}

function reset(): void {
    events = { server: [], client: [] };
}
