import { Event, IDecodedEvent, IDecodedPayload, IEvent, IPayload } from "../types/data";
import dom from "./dom";
import metadata from "./metadata";
import metrics from "./metrics";
import * as r from "./render";
import viewport from "./viewport";

let pageId: string = null;
let payloads: IPayload[] = [];

export function json(payload: IPayload): IDecodedPayload {
    if (pageId !== payload.p) {
        payloads = [];
        pageId = payload.p;
        r.reset();
    }

    let decoded: IDecodedPayload = {
        time: payload.t,
        sequence: payload.n,
        version: payload.v,
        pageId: payload.p,
        userId: payload.u,
        siteId: payload.s,
        metrics: metrics(JSON.parse(payload.m)),
        data: null
    };

    let data: IDecodedEvent[] = [];
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
        data.push(exploded);
    }
    decoded.data = data;

    return decoded;
}

export function html(payload: IPayload): string {
    let placeholder = document.createElement("iframe");
    render(payload, placeholder);
    return placeholder.contentDocument.documentElement.outerHTML;
}

export function render(payload: IPayload, placeholder: HTMLElement): void {
    let decoded = json(payload);

    let header = placeholder.firstElementChild as HTMLElement;
    let iframe = placeholder.lastElementChild as HTMLIFrameElement;

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
