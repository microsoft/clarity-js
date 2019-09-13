import { IDecodedMetric } from "./metric";

export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

export const enum Event {
    Page,
    Unload,
    Discover,
    Mutation,
    BoxModel,
    Checksum,
    Ping,
    Click,
    MouseMove,
    MouseDown,
    MouseUp,
    MouseWheel,
    DoubleClick,
    RightClick,
    TouchStart,
    TouchEnd,
    TouchMove,
    TouchCancel,
    Selection,
    Resize,
    Scroll,
    Change,
    Document,
    Visibility,
    Network,
    Performance,
    ScriptError,
    ImageError,
    LayoutSummary
}

export const enum Upload {
    Async,
    Beacon,
    Backup
}

export interface IPayload {
    e: Token[];
    m: Token[];
    d: Token[][];
}

export interface ISerializedPayload {
    e: string;
    m: string;
    d: string;
}

export interface IDecodedPayload {
    time: number;
    envelope: IEnvelope;
    metrics: IDecodedMetric;
    stream: IDecodedEvent[];
    backup: IDecodedEvent[];
}

export interface IDecodedEvent {
    time: number;
    event: Event;
    data: any;
}

export interface ICookieData {
    userId: string;
    sessionId: string;
    timestamp: number;
}

export interface IClarityData {
    userId: string;
    sessionId: string;
    pageId: string;
}

export interface IMetadata {
    page: IPage;
    envelope: IEnvelope;
}

export interface IPage {
    url: string;
    title: string;
    referrer: string;
}

export interface IEnvelope {
    sequence: number;
    version: string;
    projectId: string;
    userId: string;
    sessionId: string;
    pageId: string;
    upload: Upload;
    end: number;
}

export interface IPing {
    gap: number;
}
