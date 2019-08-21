import { Event, Flush, IEventQueue, Token } from "@clarity-types/data";
import config from "@src/core/config";
import upload from "@src/data/upload";

let events: IEventQueue = { one: [], two: [] };
let timeout: number = null;

window["PAYLOAD"] = [];

export default function(data: Token[], flush: Flush = Flush.Schedule): void {
    let event = data[1];

    switch (event) {
        case Event.Mouse:
        case Event.Touch:
        case Event.Keyboard:
        case Event.Selection:
        case Event.Resize:
        case Event.Scroll:
        case Event.Document:
        case Event.Visibility:
            events.one.push(data);
            break;
        default:
            events.two.push(data);
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
    upload(events);
    reset();
}

function reset(): void {
    events = { one: [], two: [] };
}
