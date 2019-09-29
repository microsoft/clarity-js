import { Envelope, Event, MetricData, PageData, PingData, SummaryData, TagData,  } from "./data";
import { ImageErrorData, ScriptErrorData } from "./diagnostic";
import { ChangeData, PointerData, ResizeData, ScrollData, SelectionData, UnloadData, VisibileData } from "./interaction";
import { Attributes, BoxModelData, ChecksumData, DocumentData, ResourceData } from "./layout";

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
    change?: ChangeEvent[];
    pointer?: PointerEvent[];
    resize?: ResizeEvent[];
    scroll?: ScrollEvent[];
    selection?: SelectionEvent[];
    unload?: UnloadEvent[];
    visible?: VisibileEvent[];
    boxmodel?: BoxModelEvent[];
    checksum?: ChecksumEvent[];
    resource?: ResourceEvent[];
    dom?: DomEvent[];
    doc?: DocumentEvent[];
    summary?: SummaryEvent[];
}

export interface PartialEvent {
    time: number;
    event: Event;
}

/* Data Events */
export interface MetricEvent extends PartialEvent { data: MetricData; }
export interface PageEvent extends PartialEvent { data: PageData; }
export interface PingEvent extends PartialEvent { data: PingData; }
export interface SummaryEvent extends PartialEvent { data: SummaryData[]; }
export interface TagEvent extends PartialEvent { data: TagData; }
export interface DataEvent extends PartialEvent {
    data: MetricData | PageData | PingData | SummaryData[] | TagData;
}

/* Diagnostic Events */
export interface BrokenImageEvent extends PartialEvent { data: ImageErrorData; }
export interface ScriptErrorEvent extends PartialEvent { data: ScriptErrorData; }
export interface DiagnosticEvent extends PartialEvent {
    data: ImageErrorData | ScriptErrorData;
}

/* Interaction Events */
export interface ChangeEvent extends PartialEvent { data: ChangeData; }
export interface PointerEvent extends PartialEvent { data: PointerData; }
export interface ResizeEvent extends PartialEvent { data: ResizeData; }
export interface ScrollEvent extends PartialEvent { data: ScrollData; }
export interface SelectionEvent extends PartialEvent { data: SelectionData; }
export interface UnloadEvent extends PartialEvent { data: UnloadData; }
export interface VisibileEvent extends PartialEvent { data: VisibileData; }
export interface InteractionEvent extends PartialEvent {
    data: ChangeData | PointerData | ResizeData | ScrollData | SelectionData | UnloadData | VisibileData;
}

/* Layout Events */
export interface BoxModelEvent extends PartialEvent { data: BoxModelData[]; }
export interface ChecksumEvent extends PartialEvent { data: ChecksumData[]; }
export interface DocumentEvent extends PartialEvent { data: DocumentData; }
export interface DomEvent extends PartialEvent { data: DomData[]; }
export interface ResourceEvent extends PartialEvent { data: ResourceData[]; }
export interface LayoutEvent extends PartialEvent {
    data: BoxModelData[] | ChecksumData[] | DocumentData | DomData[] | ResourceData[];
}

/* Event Data */

export interface DomData {
    id: number;
    parent: number;
    next: number;
    tag: string;
    attributes?: Attributes;
    value?: string;
}
