import version from "../src/core/version";
import { Event, Payload, Token } from "../types/data";
import { MetricEvent, PageEvent, PingEvent, SummaryEvent, TagEvent, TargetEvent, UploadEvent } from "../types/decode/data";
import { DecodedEvent, DecodedPayload } from "../types/decode/decode";
import { ImageErrorEvent, ScriptErrorEvent } from "../types/decode/diagnostic";
import { InputChangeEvent, PointerEvent, ResizeEvent, ScrollEvent } from "../types/decode/interaction";
import { SelectionEvent, UnloadEvent, VisibilityEvent } from "../types/decode/interaction";
import { BoxModelEvent, DocumentEvent, DomEvent, HashEvent, ResourceEvent } from "../types/decode/layout";

import * as data from "./data";
import * as diagnostic from "./diagnostic";
import * as interaction from "./interaction";
import * as layout from "./layout";
import * as r from "./render";

let pageId: string = null;

export function decode(input: string): DecodedPayload {
    let json: Payload = typeof input === "string" ? JSON.parse(input) : input;
    let envelope = data.envelope(json.e);
    let timestamp = Date.now();
    let payload: DecodedPayload = { timestamp, envelope };
    let encoded: Token[][] = json.d;

    if (payload.envelope.version !== version) {
        throw new Error(`Invalid Clarity Version. Actual: ${payload.envelope.version} | Expected: ${version} | ${input.substr(0, 250)}`);
    }

    /* Reset components before decoding to keep them stateless */
    data.reset();
    layout.reset();

    for (let entry of encoded) {
        data.summarize(entry);
        switch (entry[1]) {
            case Event.Page:
                if (payload.page === undefined) { payload.page = []; }
                payload.page.push(data.decode(entry) as PageEvent);
                break;
            case Event.Ping:
                if (payload.ping === undefined) { payload.ping = []; }
                payload.ping.push(data.decode(entry) as PingEvent);
                break;
            case Event.Tag:
                if (payload.tag === undefined) { payload.tag = []; }
                payload.tag.push(data.decode(entry) as TagEvent);
                break;
            case Event.Target:
                if (payload.target === undefined) { payload.target = []; }
                payload.target.push(data.decode(entry) as TargetEvent);
                break;
            case Event.Metric:
                if (payload.metric === undefined) { payload.metric = []; }
                payload.metric.push(data.decode(entry) as MetricEvent);
                break;
            case Event.Upload:
                if (payload.upload === undefined) { payload.upload = []; }
                payload.upload.push(data.decode(entry) as UploadEvent);
                break;
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
                if (payload.pointer === undefined) { payload.pointer = []; }
                payload.pointer.push(interaction.decode(entry) as PointerEvent);
                break;
            case Event.Scroll:
                if (payload.scroll === undefined) { payload.scroll = []; }
                payload.scroll.push(interaction.decode(entry) as ScrollEvent);
                break;
            case Event.Resize:
                if (payload.resize === undefined) { payload.resize = []; }
                payload.resize.push(interaction.decode(entry) as ResizeEvent);
                break;
            case Event.Selection:
                if (payload.selection === undefined) { payload.selection = []; }
                payload.selection.push(interaction.decode(entry) as SelectionEvent);
                break;
            case Event.InputChange:
                if (payload.input === undefined) { payload.input = []; }
                payload.input.push(interaction.decode(entry) as InputChangeEvent);
                break;
            case Event.Unload:
                if (payload.unload === undefined) { payload.unload = []; }
                payload.unload.push(interaction.decode(entry) as UnloadEvent);
                break;
            case Event.Visibility:
                if (payload.visibility === undefined) { payload.visibility = []; }
                payload.visibility.push(interaction.decode(entry) as VisibilityEvent);
                break;
            case Event.BoxModel:
                if (payload.boxmodel === undefined) { payload.boxmodel = []; }
                payload.boxmodel.push(layout.decode(entry) as BoxModelEvent);
                break;
            case Event.Discover:
            case Event.Mutation:
                if (payload.dom === undefined) { payload.dom = []; }
                payload.dom.push(layout.decode(entry) as DomEvent);
                break;
            case Event.Hash:
                if (payload.hash === undefined) { payload.hash = []; }
                payload.hash.push(layout.decode(entry) as HashEvent);
                break;
            case Event.Document:
                if (payload.doc === undefined) { payload.doc = []; }
                payload.doc.push(layout.decode(entry) as DocumentEvent);
                break;
            case Event.ScriptError:
                if (payload.script === undefined) { payload.script = []; }
                payload.script.push(diagnostic.decode(entry) as ScriptErrorEvent);
                break;
            case Event.ImageError:
                if (payload.image === undefined) { payload.image = []; }
                payload.image.push(diagnostic.decode(entry) as ImageErrorEvent);
                break;
            default:
                console.error(`No handler for Event: ${JSON.stringify(entry)}`);
                break;
        }
    }

    /* Enrich decoded payload with derived events */
    payload.summary = data.summary() as SummaryEvent[];
    if (payload.dom && payload.dom.length > 0) { payload.hash = layout.hash() as HashEvent[]; }
    if (layout.resources.length > 0) { payload.resource = layout.resource() as ResourceEvent[]; }

    return payload;
}

export function html(decoded: DecodedPayload): string {
    let iframe = document.createElement("iframe");
    render(decoded, iframe);
    return iframe.contentDocument.documentElement.outerHTML;
}

export function render(decoded: DecodedPayload, iframe: HTMLIFrameElement, header?: HTMLElement): void {
    // Reset rendering if we receive a new pageId
    if (pageId !== decoded.envelope.pageId) {
        pageId = decoded.envelope.pageId;
        r.reset();
    }

    // Replay events
    let events: DecodedEvent[] = [];
    for (let key in decoded) {
        if (Array.isArray(decoded[key])) {
            events = events.concat(decoded[key]);
        }
    }
    replay(events.sort(sort), iframe, header);
}

export async function replay(events: DecodedEvent[], iframe: HTMLIFrameElement, header?: HTMLElement): Promise<void> {
    let start = events[0].time;
    for (let entry of events) {
        if (entry.time - start > 16) { start = await wait(entry.time); }

        switch (entry.event) {
            case Event.Page:
                let pageEvent = entry as PageEvent;
                r.page(pageEvent.data, iframe);
                break;
            case Event.Metric:
                let metricEvent = entry as MetricEvent;
                if (header) { r.metric(metricEvent.data, header); }
                break;
            case Event.Discover:
            case Event.Mutation:
                let domEvent = entry as DomEvent;
                r.markup(domEvent.data, iframe);
                break;
            case Event.BoxModel:
                let boxModelEvent = entry as BoxModelEvent;
                r.boxmodel(boxModelEvent.data, iframe);
                break;
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
                let pointerEvent = entry as PointerEvent;
                r.pointer(pointerEvent.event, pointerEvent.data, iframe);
                break;
            case Event.InputChange:
                let changeEvent = entry as InputChangeEvent;
                r.change(changeEvent.data, iframe);
                break;
            case Event.Selection:
                let selectionEvent = entry as SelectionEvent;
                r.selection(selectionEvent.data, iframe);
                break;
            case Event.Resize:
                let resizeEvent = entry as ResizeEvent;
                r.resize(resizeEvent.data, iframe);
                break;
            case Event.Scroll:
                let scrollEvent = entry as ScrollEvent;
                r.scroll(scrollEvent.data, iframe);
                break;
        }
    }
}

async function wait(timestamp: number): Promise<number> {
    return new Promise<number>((resolve: FrameRequestCallback): void => {
        setTimeout(resolve, 10, timestamp);
    });
}

function sort(a: DecodedEvent, b: DecodedEvent): number {
    return a.time - b.time;
}
