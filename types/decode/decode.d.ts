import { Envelope, Event, MetricData, PageData, PingData, SummaryData, TagData, UploadData } from "../data";
import { DataEvent, MetricEvent, PageEvent, PingEvent, SummaryEvent, TagEvent, TargetEvent, UpgradeEvent, UploadEvent } from "./data";
import { DiagnosticEvent, ImageErrorEvent, ScriptErrorEvent } from "./diagnostic";
import { InputEvent, InteractionEvent, PointerEvent, ResizeEvent } from "./interaction";
import { ScrollEvent, SelectionEvent, UnloadEvent, VisibilityEvent } from "./interaction";
import { BoxModelEvent, DocumentEvent, DomEvent, HashEvent, LayoutEvent, ResourceEvent } from "./layout";
import { ConnectionEvent, LargestContentfulPaintEvent, LongTaskEvent, MemoryEvent } from "./performance";
import { NavigationEvent, NetworkEvent, PaintEvent } from "./performance";

export type DecodedEvent = DataEvent | DiagnosticEvent | InteractionEvent | LayoutEvent;

export interface DecodedPayload {
    timestamp: number;
    envelope: Envelope;
    ua?: string;
    metric?: MetricEvent[];
    page?: PageEvent[];
    ping?: PingEvent[];
    tag?: TagEvent[];
    image?: ImageErrorEvent[];
    script?: ScriptErrorEvent[];
    input?: InputEvent[];
    pointer?: PointerEvent[];
    resize?: ResizeEvent[];
    scroll?: ScrollEvent[];
    selection?: SelectionEvent[];
    summary?: SummaryEvent[];
    unload?: UnloadEvent[];
    upgrade?: UpgradeEvent[];
    upload?: UploadEvent[];
    visibility?: VisibilityEvent[];
    boxmodel?: BoxModelEvent[];
    hash?: HashEvent[];
    resource?: ResourceEvent[];
    dom?: DomEvent[];
    doc?: DocumentEvent[];
    target?: TargetEvent[];
    connection?: ConnectionEvent[];
    contentfulPaint?: LargestContentfulPaintEvent[];
    longtask?: LongTaskEvent[];
    memory?: MemoryEvent[];
    navigation?: NavigationEvent[];
    network?: NetworkEvent[];
    paint?: PaintEvent[];
}

export interface DecodedVersion {
    major: number;
    minor: number;
    patch: number;
    beta: number;
}
