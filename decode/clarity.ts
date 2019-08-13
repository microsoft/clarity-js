import { Event, IDecodedEvent, IDecodedPayload, IEvent, IPayload } from "../types/data";
import dom from "./dom";
import envelope from "./envelope";
import metadata from "./metadata";
import metrics from "./metrics";
import * as r from "./render";
import viewport from "./viewport";

let pageId: string = null;
let payloads: IPayload[] = [];

export function json(data: string): IDecodedPayload {
    let payload = JSON.parse(data);
    let decoded: IDecodedPayload = {
        envelope: envelope(payload.e),
        metrics: metrics(payload.m),
        data: null
    };

    if (pageId !== decoded.envelope.pageId) {
        payloads = [];
        pageId = decoded.envelope.pageId;
        r.reset();
    }

    let events: IDecodedEvent[] = [];
    let encoded: IEvent[] = payload.d;
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
        events.push(exploded);
    }
    decoded.data = events;

    return decoded;
}

export function html(data: string): string {
    let iframe = document.createElement("iframe");
    render(data, iframe);
    return iframe.contentDocument.documentElement.outerHTML;
}

export function render(data: string, iframe: HTMLIFrameElement, header?: HTMLElement): void {
    let decoded = json(data);

    // Render metrics
    r.metrics(decoded.metrics, header);

    // Render events
    let events = decoded.data;
    for (let entry of events) {
        switch (entry.event) {
            case Event.Discover:
            case Event.Mutation:
                r.markup(entry.data, iframe);
                break;
            case Event.Resize:
                r.resize(entry.data[0], iframe);
                break;
        }
    }
}
