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
    Click,
    MouseMove,
    MouseDown,
    MouseUp,
    MouseWheel,
    DoubleClick,
    RightClick,
    Touch,
    Keyboard,
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
    e: string;
    m: string;
    d: string;
}

export interface IDecodedPayload {
    time: number;
    envelope: IEnvelope;
    metrics: IDecodedMetric;
    analytics: IDecodedEvent[];
    playback: IDecodedEvent[];
    summary: IDecodedEvent[];
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
    pageId: string;
    userId: string;
    sessionId: string;
    projectId: string;
    upload: Upload;
    end: number;
}
