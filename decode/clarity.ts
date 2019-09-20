import version from "../src/core/version";
import { Event, IAugmentation, IDecodedEvent, IDecodedPayload, IPayload, Token } from "../types/data";
import diagnostic from "./diagnostic";
import envelope from "./envelope";
import interaction from "./interaction";
import layout from "./layout";
import metric from "./metric";
import page from "./page";
import * as r from "./render";
import summarize from "./summary";

let pageId: string = null;

export function decode(data: string | IPayload, augmentations: IAugmentation = null): IDecodedPayload {
    let json: IPayload = typeof data === "string" ? JSON.parse(data) : data;
    let timestamp = augmentations ? augmentations.timestamp : Date.now();
    let ua = augmentations ? augmentations.ua : (navigator && "userAgent" in navigator ? navigator.userAgent : "");
    let payload: IDecodedPayload = { timestamp, ua, envelope: envelope(json.e), metrics: metric(json.m), analytics: [], playback: [] };
    let encoded: Token[][] = json.d;

    if (payload.envelope.version !== version) {
        throw new Error(`Invalid Clarity Version. Actual: ${payload.envelope.version} | Expected: ${version}`);
    }

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
            case Event.TouchStart:
            case Event.TouchCancel:
            case Event.TouchEnd:
            case Event.TouchMove:
                event = interaction(entry);
                payload.analytics.push(event);
                break;
            case Event.BoxModel:
                event = layout(entry);
                payload.playback.push(event);
                break;
            case Event.Discover:
            case Event.Mutation:
                event = layout(entry);
                payload.playback.push(event);
                let summary = summarize(event);
                if (summary) { payload.analytics.push(summary); }
                break;
            case Event.Checksum:
                event = layout(entry);
                payload.analytics.push(event);
                break;
            case Event.Page:
                event = page(entry);
                payload.analytics.push(event);
                break;
            case Event.ScriptError:
            case Event.ImageError:
                event = diagnostic(entry);
                payload.analytics.push(event);
                break;
            default:
                event = {time: entry[0] as number, event: entry[1] as number, data: entry.slice(2)};
                payload.playback.push(event);
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
    let events = [...decoded.analytics, ...decoded.playback].sort(sort);
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
