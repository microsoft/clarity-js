import { Event, IDecodedEvent, IDecodedPayload, IPayload, Token } from "../types/data";
import envelope from "./envelope";
import interaction from "./interaction";
import layout from "./layout";
import metric from "./metric";
import page from "./page";
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

    let encoded: Token[][] = payload.d;
    payloads.push(payload);

    for (let entry of encoded) {
        let event: IDecodedEvent;
        switch (entry[1]) {
            case Event.Scroll:
            case Event.Document:
            case Event.Resize:
            case Event.Selection:
            case Event.Change:
            case Event.MouseDown:
            case Event.MouseUp:
            case Event.MouseMove:
            case Event.MouseWheel:
            case Event.Click:
            case Event.DoubleClick:
            case Event.RightClick:
                event = interaction(entry);
                break;
            case Event.Discover:
            case Event.Mutation:
            case Event.BoxModel:
            case Event.Checksum:
                event = layout(entry);
                break;
            case Event.Page:
                event = page(entry);
                break;
            default:
                event = {time: entry[0] as number, event: entry[1] as number, data: entry.slice(2)};
                break;
        }
        decoded.events.push(event);
    }
    decoded.events.sort(sort);
    return decoded;
}

export function html(decoded: IDecodedPayload): string {
    let iframe = document.createElement("iframe");
    render(decoded, iframe);
    return iframe.contentDocument.documentElement.outerHTML;
}

export function render(decoded: IDecodedPayload, iframe: HTMLIFrameElement, header?: HTMLElement): void {
    // Render metrics
    r.metrics(decoded.metrics, header);

    // Replay events
    replay(decoded.events, iframe);
}

export async function replay(events: IDecodedEvent[], iframe: HTMLIFrameElement): Promise<void> {
    let start = events[0].time;
    for (let entry of events) {
        if (entry.time - start > 16) { start = await wait(entry.time); }

        switch (entry.event) {
            case Event.Discover:
            case Event.Mutation:
                r.markup(entry.data, iframe);
                break;
            case Event.Checksum:
                r.checksum(entry.data, iframe);
                break;
            case Event.BoxModel:
                r.boxmodel(entry.data, iframe);
                break;
            case Event.MouseDown:
            case Event.MouseUp:
            case Event.MouseMove:
            case Event.MouseWheel:
            case Event.Click:
            case Event.DoubleClick:
            case Event.RightClick:
                r.mouse(entry.event, entry.data, iframe);
                break;
            case Event.Change:
                r.change(entry.data, iframe);
                break;
            case Event.Selection:
                r.selection(entry.data, iframe);
                break;
            case Event.Resize:
                r.resize(entry.data, iframe);
                break;
            case Event.Scroll:
                r.scroll(entry.data, iframe);
                break;
        }
    }
}

async function wait(timestamp: number): Promise<number> {
    return new Promise<number>((resolve: FrameRequestCallback): void => {
        setTimeout(resolve, 10, timestamp);
    });
}

function sort(a: IDecodedEvent, b: IDecodedEvent): number {
    return a.time - b.time;
}
