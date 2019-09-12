import { Event, IDecodedEvent, IDecodedPayload, IPayload, Token } from "../types/data";
import envelope from "./envelope";
import interaction from "./interaction";
import layout from "./layout";
import metric from "./metric";
import page from "./page";
import * as r from "./render";
import summarize from "./summary";

let pageId: string = null;

export function decode(data: string | IPayload): IDecodedPayload {
    let json: IPayload = typeof data === "string" ? JSON.parse(data) : data;
    let time = Date.now();
    let payload: IDecodedPayload = { time, envelope: envelope(json.e), metrics: metric(json.m), stream: [], backup: [] };
    let encoded: Token[][] = json.d;

    for (let entry of encoded) {
        let event: IDecodedEvent;
        let summary: IDecodedEvent;
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
            case Event.TouchStart:
            case Event.TouchCancel:
            case Event.TouchEnd:
            case Event.TouchMove:
                event = interaction(entry);
                payload.stream.push(event);
                break;
            case Event.BoxModel:
                event = layout(entry);
                payload.backup.push(event);
                break;
            case Event.Discover:
            case Event.Mutation:
                event = layout(entry);
                summary = summarize(event);
                payload.stream.push(event);
                payload.stream.push(summary);
                break;
            case Event.Checksum:
                event = layout(entry);
                payload.stream.push(event);
                break;
            case Event.Page:
                event = page(entry);
                payload.backup.push(event);
                break;
            default:
                event = {time: entry[0] as number, event: entry[1] as number, data: entry.slice(2)};
                payload.backup.push(event);
                break;
        }
    }
    return payload;
}

export function html(decoded: IDecodedPayload): string {
    let iframe = document.createElement("iframe");
    render(decoded, iframe);
    return iframe.contentDocument.documentElement.outerHTML;
}

export function render(decoded: IDecodedPayload, iframe: HTMLIFrameElement, header?: HTMLElement): void {
    // Reset rendering if we receive a new pageId
    if (pageId !== decoded.envelope.pageId) {
        pageId = decoded.envelope.pageId;
        r.reset();
    }

    // Render metrics
    r.metric(decoded.metrics, header);

    // Replay events
    let events = [...decoded.stream, ...decoded.backup].sort(sort);
    replay(events, iframe);
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
                r.pointer(entry.event, entry.data, iframe);
                break;
            case Event.TouchStart:
            case Event.TouchCancel:
            case Event.TouchEnd:
            case Event.TouchMove:
                r.pointer(entry.event, entry.data, iframe);
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
