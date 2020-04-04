import version from "../src/core/version";
import { Event, Metric, Payload, Token } from "../types/data";
import { MetricEvent, PageEvent, PingEvent, SummaryEvent, TagEvent, TargetEvent, UpgradeEvent, UploadEvent } from "../types/decode/data";
import { DecodedEvent, DecodedPayload, DecodedVersion } from "../types/decode/decode";
import { ImageErrorEvent, ScriptErrorEvent } from "../types/decode/diagnostic";
import { InputChangeEvent, PointerEvent, ResizeEvent, ScrollEvent } from "../types/decode/interaction";
import { SelectionEvent, UnloadEvent, VisibilityEvent } from "../types/decode/interaction";
import { BoxModelEvent, DocumentEvent, DomEvent, HashEvent, ResourceEvent } from "../types/decode/layout";
import { ConnectionEvent, LargestContentfulPaintEvent, LongTaskEvent, MemoryEvent } from "../types/decode/performance";
import { NavigationEvent, NetworkEvent, PaintEvent } from "../types/decode/performance";

import * as data from "./data";
import * as diagnostic from "./diagnostic";
import * as interaction from "./interaction";
import * as layout from "./layout";
import * as performance from "./performance";
import * as r from "./render";

let pageId: string = null;

export function decode(input: string): DecodedPayload {
    let json: Payload = JSON.parse(input);
    let envelope = data.envelope(json.e);
    let timestamp = Date.now();
    let payload: DecodedPayload = { timestamp, envelope };
    // Sort encoded events by time to simplify summary computation
    let encoded: Token[][] = json.d.sort((a: Token[], b: Token[]) => (a[0] as number) - (b[0] as number));

    // Check if the incoming version is compatible with the current running code
    // We do an exact match for major, minor and path components of the version.
    // However, the beta portion of the version can be either same, one less or one more.
    // This ensures we are backward and forward compatible with upto one version change.
    let jsonVersion = parseVersion(payload.envelope.version);
    let codeVersion = parseVersion(version);

    if (jsonVersion.major !== codeVersion.major ||
        jsonVersion.minor !== codeVersion.minor ||
        jsonVersion.patch !== codeVersion.patch ||
        Math.abs(jsonVersion.beta - codeVersion.beta) > 1) {
        throw new Error(`Invalid version. Actual: ${payload.envelope.version} | Expected: ${version} (+/- 1) | ${input.substr(0, 250)}`);
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
            case Event.Upgrade:
                if (payload.upgrade === undefined) { payload.upgrade = []; }
                payload.upgrade.push(data.decode(entry) as UpgradeEvent);
                break;
            case Event.Metric:
                if (payload.metric === undefined) { payload.metric = []; }
                let metric = data.decode(entry) as MetricEvent;
                // It's not possible to accurately include the byte count of the payload within the same payload
                // So, we increment the bytes from the incoming payload at decode time.
                // Also, initialize TotalBytes if it doesn't exist. For the first payload, this value can be null.
                if (!(Metric.TotalBytes in metric.data)) { metric.data[Metric.TotalBytes] = 0; }
                metric.data[Metric.TotalBytes] += input.length;
                payload.metric.push(metric);
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
            case Event.Connection:
                if (payload.connection === undefined) { payload.connection = []; }
                payload.connection.push(performance.decode(entry) as ConnectionEvent);
                break;
            case Event.ContentfulPaint:
                if (payload.contentfulPaint === undefined) { payload.contentfulPaint = []; }
                payload.contentfulPaint.push(performance.decode(entry) as LargestContentfulPaintEvent);
                break;
            case Event.LongTask:
                if (payload.longtask === undefined) { payload.longtask = []; }
                payload.longtask.push(performance.decode(entry) as LongTaskEvent);
                break;
            case Event.Memory:
                if (payload.memory === undefined) { payload.memory = []; }
                payload.memory.push(performance.decode(entry) as MemoryEvent);
                break;
            case Event.Navigation:
                if (payload.navigation === undefined) { payload.navigation = []; }
                payload.navigation.push(performance.decode(entry) as NavigationEvent);
                break;
            case Event.Network:
                if (payload.network === undefined) { payload.network = []; }
                payload.network.push(performance.decode(entry) as NetworkEvent);
                break;
            case Event.Paint:
                if (payload.paint === undefined) { payload.paint = []; }
                payload.paint.push(performance.decode(entry) as PaintEvent);
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
    // Reset rendering if we receive a new pageId or we receive the first sequence
    if (pageId !== decoded.envelope.pageId || decoded.envelope.sequence === 1) {
        pageId = decoded.envelope.pageId;
        reset();
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

export function reset(): void {
    r.reset();
}

export async function replay(
    events: DecodedEvent[],
    iframe: HTMLIFrameElement,
    header?: HTMLElement,
    resizeCallback?: (width: number, height: number) => void
    ): Promise<void> {
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
                r.markup(domEvent.event, domEvent.data, iframe);
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
                r.resize(resizeEvent.data, iframe, resizeCallback);
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

function parseVersion(ver: string): DecodedVersion {
    let parts = ver.split(".");
    if (parts.length === 3) {
        let subparts = parts[2].split("-b");
        if (subparts.length === 2) {
            return {
                major: parseInt(parts[0], 10),
                minor: parseInt(parts[1], 10),
                patch: parseInt(subparts[0], 10),
                beta: parseInt(subparts[1], 10)
            };
        }
    }
    return { major: 0, minor: 0, patch: 0, beta: 0 };
}
