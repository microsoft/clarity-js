import version from "../src/core/version";
import { Event, IAugmentation, IPayload, Token } from "../types/data";
import * as Decode from "../types/decode";
import * as data from "./data";
import * as diagnostic from "./diagnostic";
import * as interaction from "./interaction";
import * as layout from "./layout";
import * as r from "./render";

let pageId: string = null;

export function decode(input: string | IPayload, augmentations: IAugmentation = null): Decode.IDecodedPayload {
    let json: IPayload = typeof input === "string" ? JSON.parse(input) : input;
    let envelope = data.envelope(json.e);
    let timestamp = augmentations && augmentations.timestamp ? augmentations.timestamp : Date.now();
    let ua = augmentations && augmentations.ua ? augmentations.ua : (navigator && "userAgent" in navigator ? navigator.userAgent : "");
    let payload: Decode.IDecodedPayload = { timestamp, envelope };
    if (envelope.sequence === 1) { payload.ua = ua; }
    let encoded: Token[][] = json.d;

    if (payload.envelope.version !== version) {
        throw new Error(`Invalid Clarity Version. Actual: ${payload.envelope.version} | Expected: ${version}`);
    }

    /* Reset components before decoding to keep them stateless */
    data.reset();
    layout.reset();

    for (let entry of encoded) {
        data.summarize(entry);
        switch (entry[1]) {
            case Event.Page:
                if (payload.page === undefined) { payload.page = []; }
                payload.page.push(data.decode(entry) as Decode.IPageEvent);
                break;
            case Event.Ping:
                if (payload.ping === undefined) { payload.ping = []; }
                payload.ping.push(data.decode(entry) as Decode.IPingEvent);
                break;
            case Event.Tag:
                if (payload.tag === undefined) { payload.tag = []; }
                payload.tag.push(data.decode(entry) as Decode.ITagEvent);
                break;
            case Event.Metric:
                if (payload.metric === undefined) { payload.metric = []; }
                payload.metric.push(data.decode(entry) as Decode.IMetricEvent);
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
                payload.pointer.push(interaction.decode(entry) as Decode.IPointerEvent);
                break;
            case Event.Scroll:
                if (payload.scroll === undefined) { payload.scroll = []; }
                payload.scroll.push(interaction.decode(entry) as Decode.IScrollEvent);
                break;
            case Event.Resize:
                if (payload.resize === undefined) { payload.resize = []; }
                payload.resize.push(interaction.decode(entry) as Decode.IResizeEvent);
                break;
            case Event.Selection:
                if (payload.selection === undefined) { payload.selection = []; }
                payload.selection.push(interaction.decode(entry) as Decode.ISelectionEvent);
                break;
            case Event.Change:
                if (payload.change === undefined) { payload.change = []; }
                payload.change.push(interaction.decode(entry) as Decode.IChangeEvent);
                break;
            case Event.BoxModel:
                if (payload.boxmodel === undefined) { payload.boxmodel = []; }
                payload.boxmodel.push(layout.decode(entry) as Decode.IBoxModelEvent);
                break;
            case Event.Discover:
            case Event.Mutation:
                if (payload.dom === undefined) { payload.dom = []; }
                payload.dom.push(layout.decode(entry) as Decode.IDomEvent);
                break;
            case Event.Checksum:
                if (payload.checksum === undefined) { payload.checksum = []; }
                payload.checksum.push(layout.decode(entry) as Decode.IChecksumEvent);
                break;
            case Event.Document:
                if (payload.doc === undefined) { payload.doc = []; }
                payload.doc.push(layout.decode(entry) as Decode.IDocumentEvent);
                break;
            case Event.ScriptError:
                if (payload.script === undefined) { payload.script = []; }
                payload.script.push(diagnostic.decode(entry) as Decode.IScriptErrorEvent);
                break;
            case Event.ImageError:
                if (payload.image === undefined) { payload.image = []; }
                payload.image.push(diagnostic.decode(entry) as Decode.IBrokenImageEvent);
                break;
            default:
                console.error(`No handler for Event# ${event}: ${JSON.stringify(entry)}`);
                break;
        }
    }

    /* Enrich decoded payload with derived events */
    payload.summary = data.summary();
    if (layout.checksums.length > 0) { payload.checksum = layout.checksum(); }
    if (layout.resources.length > 0) { payload.resource = layout.resource(); }

    return payload;
}

export function html(decoded: Decode.IDecodedPayload): string {
    let iframe = document.createElement("iframe");
    render(decoded, iframe);
    return iframe.contentDocument.documentElement.outerHTML;
}

export function render(decoded: Decode.IDecodedPayload, iframe: HTMLIFrameElement, header?: HTMLElement): void {
    // Reset rendering if we receive a new pageId
    if (pageId !== decoded.envelope.pageId) {
        pageId = decoded.envelope.pageId;
        r.reset();
    }

    // Replay events
    let events: Decode.DecodedEvent[] = [];
    for (let key in decoded) {
        if (Array.isArray(decoded[key])) {
            events = events.concat(decoded[key]);
        }
    }
    replay(events.sort(sort), iframe, header);
}

export async function replay(events: Decode.DecodedEvent[], iframe: HTMLIFrameElement, header?: HTMLElement): Promise<void> {
    let start = events[0].time;
    for (let entry of events) {
        if (entry.time - start > 16) { start = await wait(entry.time); }

        switch (entry.event) {
            case Event.Page:
                let pageEvent = entry as Decode.IPageEvent;
                r.page(pageEvent.data, iframe);
                break;
            case Event.Metric:
                let metricEvent = entry as Decode.IMetricEvent;
                if (header) { r.metric(metricEvent.data, header); }
                break;
            case Event.Discover:
            case Event.Mutation:
                let domEvent = entry as Decode.IDomEvent;
                r.markup(domEvent.data, iframe);
                break;
            case Event.BoxModel:
                let boxModelEvent = entry as Decode.IBoxModelEvent;
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
                let pointerEvent = entry as Decode.IPointerEvent;
                r.pointer(pointerEvent.event, pointerEvent.data, iframe);
                break;
            case Event.Change:
                let changeEvent = entry as Decode.IChangeEvent;
                r.change(changeEvent.data, iframe);
                break;
            case Event.Selection:
                let selectionEvent = entry as Decode.ISelectionEvent;
                r.selection(selectionEvent.data, iframe);
                break;
            case Event.Resize:
                let resizeEvent = entry as Decode.IResizeEvent;
                r.resize(resizeEvent.data, iframe);
                break;
            case Event.Scroll:
                let scrollEvent = entry as Decode.IScrollEvent;
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

function sort(a: Decode.DecodedEvent, b: Decode.DecodedEvent): number {
    return a.time - b.time;
}
