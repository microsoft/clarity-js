import { Event, IDecodedEvent, IEvent, IPayload } from "../types/data";
import dom from "./dom";
import metadata from "./metadata";
import { markup, reset, resize } from "./render";
import viewport from "./viewport";

let pageId: string = null;
let payloads: IPayload[] = [];

export function json(payload: IPayload): IDecodedEvent[] {
    if (pageId !== payload.p) {
        payloads = [];
        pageId = payload.p;
        reset();
    }

    let decoded: IDecodedEvent[] = [];
    let encoded: IEvent[] = JSON.parse(payload.d);
    payloads.push(payload);

    for (let entry of encoded) {
        let exploded: IDecodedEvent = { time: entry.t, event: entry.e, data: null };
        switch (entry.e) {
            case Event.Scroll:
            case Event.Document:
            case Event.Resize:
                exploded.data = viewport(entry.d, entry.e);
                break;
            case Event.Discover:
            case Event.Mutation:
                exploded.data = dom(entry.d, entry.e);
                break;
            case Event.Metadata:
                exploded.data = metadata(entry.d, entry.e);
                break;
        }
        decoded.push(exploded);
    }
    return decoded;
}

export function html(payload: IPayload): string {
    let placeholder = document.createElement("iframe");
    render(payload, placeholder);
    return placeholder.contentDocument.documentElement.outerHTML;
}

export function render(payload: IPayload, placeholder: HTMLIFrameElement): void {
    let decoded = json(payload);
    for (let entry of decoded) {
        switch (entry.event) {
            case Event.Discover:
            case Event.Mutation:
                markup(entry.data, placeholder);
                break;
            case Event.Resize:
                resize(entry.data[0], placeholder);
                break;
        }
    }
}
