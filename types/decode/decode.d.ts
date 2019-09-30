import { Envelope, Event, MetricData, PageData, PingData, SummaryData, TagData, UploadData } from "../data";
import { DataEvent, MetricEvent, PageEvent, PingEvent, SummaryEvent, TagEvent, UploadEvent } from "./data";
import { BrokenImageEvent, DiagnosticEvent, ScriptErrorEvent } from "./diagnostic";
import { InputChangeEvent, InteractionEvent, PointerEvent, ResizeEvent } from "./interaction";
import { ScrollEvent, SelectionEvent, UnloadEvent, VisibileEvent } from "./interaction";
import { BoxModelEvent, DocumentEvent, DomEvent, HashEvent, LayoutEvent, ResourceEvent } from "./layout";

export type DecodedEvent = DataEvent | DiagnosticEvent | InteractionEvent | LayoutEvent;

export interface DecodedPayload {
    timestamp: number;
    envelope: Envelope;
    ua?: string;
    metric?: MetricEvent[];
    page?: PageEvent[];
    ping?: PingEvent[];
    tag?: TagEvent[];
    image?: BrokenImageEvent[];
    script?: ScriptErrorEvent[];
    input?: InputChangeEvent[];
    pointer?: PointerEvent[];
    resize?: ResizeEvent[];
    scroll?: ScrollEvent[];
    selection?: SelectionEvent[];
    summary?: SummaryEvent[];
    unload?: UnloadEvent[];
    upload?: UploadEvent[];
    visible?: VisibileEvent[];
    boxmodel?: BoxModelEvent[];
    hash?: HashEvent[];
    resource?: ResourceEvent[];
    dom?: DomEvent[];
    doc?: DocumentEvent[];
}
