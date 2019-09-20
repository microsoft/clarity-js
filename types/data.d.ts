import { IMetric } from "./metric";

export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

export const enum Event {
    Page = 0,
    Unload = 1,
    Discover = 2,
    Mutation = 3,
    BoxModel = 4,
    Checksum = 5,
    Ping = 6,
    Click = 7,
    MouseMove = 8,
    MouseDown = 9,
    MouseUp = 10,
    MouseWheel = 11,
    DoubleClick = 12,
    RightClick = 13,
    TouchStart = 14,
    TouchEnd = 15,
    TouchMove = 16,
    TouchCancel = 17,
    Selection = 18,
    Resize = 19,
    Scroll = 20,
    Change = 21,
    Document = 22,
    Visibility = 23,
    Network = 24,
    Performance = 25,
    ScriptError = 26,
    ImageError = 27,
    LayoutSummary = 28
}

export const enum Upload {
    Async = 0,
    Beacon = 1,
    Backup = 2
}

export const enum Flag {
    False = 0,
    True = 1
}

export interface IPayload {
    e: Token[];
    m: Token[];
    d: Token[][];
}

export interface IEncodedPayload {
    e: string;
    m: string;
    d: string;
}

export interface IDecodedPayload {
    timestamp: number;
    ua: string;
    envelope: IEnvelope;
    metrics: IMetric;
    analytics: IDecodedEvent[];
    playback: IDecodedEvent[];
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
    timestamp: number;
    elapsed: number;
    url: string;
    title: string;
    referrer: string;
}

export interface IEnvelope {
    elapsed: number;
    sequence: number;
    version: string;
    projectId: string;
    userId: string;
    sessionId: string;
    pageId: string;
    upload: Upload;
    end: Flag;
}

export interface IPing {
    gap: number;
}

export interface IAugmentation {
    timestamp: number;
    ua: string;
}
