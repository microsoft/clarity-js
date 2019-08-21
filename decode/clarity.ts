import { Event, IDecodedEvent, IDecodedPayload, IPayload, Token } from "../types/data";
import dom from "./dom";
import envelope from "./envelope";
import interaction from "./interaction";
import metadata from "./metadata";
import metric from "./metric";
import * as r from "./render";

let pageId: string = null;
let payloads: IPayload[] = [];

export function json(data: string): IDecodedPayload {
    let payload = JSON.parse(data);
    let decoded: IDecodedPayload = {
        envelope: envelope(payload.e),
        metrics: metric(payload.m),
        events: []
    };

    if (pageId !== decoded.envelope.pageId) {
        payloads = [];
        pageId = decoded.envelope.pageId;
        r.reset();
    }

    let encoded: Token[][] = merge(payload.a, payload.b);
    payloads.push(payload);

    for (let entry of encoded) {
        let event: IDecodedEvent;
        switch (entry[1]) {
            case Event.Scroll:
            case Event.Document:
            case Event.Resize:
                event = interaction(entry);
                break;
            case Event.Discover:
            case Event.Mutation:
                event = dom(entry);
                break;
            case Event.Metadata:
                event = metadata(entry);
                break;
            default:
                event = {time: entry[0] as number, event: entry[1] as number, data: entry.slice(2)};
                break;
        }
        decoded.events.push(event);
    }
    return decoded;
}

export function html(data: string): string {
    let iframe = document.createElement("iframe");
    render(data, iframe);
    return iframe.contentDocument.documentElement.outerHTML;
}

export function render(data: string, iframe: HTMLIFrameElement, header?: HTMLElement): void {
    let decoded = json(data);
    console.log("Decoded: " + JSON.stringify(decoded));

    // Render metrics
    r.metrics(decoded.metrics, header);

    // Render events
    let events = decoded.events;
    for (let entry of events) {
        switch (entry.event) {
            case Event.Discover:
            case Event.Mutation:
                r.markup(entry.data, iframe);
                break;
            case Event.Resize:
                r.resize(entry.data[0], iframe);
                break;
            case Event.Scroll:
                r.scroll(entry.data, iframe);
                break;
        }
    }
}

function merge(one: Token[][], two: Token[][]): Token[][] {
    return one.concat(two).sort(function(a: Token[], b: Token[]): number {
        let x = a[0] as number;
        let y = b[0] as number;
        return x - y;
    });
}
