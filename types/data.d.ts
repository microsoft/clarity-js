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
    Tag = 6,
    Ping = 7,
    Click = 8,
    MouseMove = 9,
    MouseDown = 10,
    MouseUp = 11,
    MouseWheel = 12,
    DoubleClick = 13,
    RightClick = 14,
    TouchStart = 15,
    TouchEnd = 16,
    TouchMove = 17,
    TouchCancel = 18,
    Selection = 19,
    Resize = 20,
    Scroll = 21,
    Change = 22,
    Document = 23,
    Visibility = 24,
    Network = 25,
    Performance = 26,
    ScriptError = 27,
    ImageError = 28,
    Layout = 29,
    Crawl = 30,
    Summary = 31
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
    page: IPageData;
    envelope: IEnvelope;
}

export interface IPageData {
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

export interface IPingData {
    gap: number;
}

export interface ITagData {
    key: string;
    value: string;
}

export interface IAugmentation {
    timestamp: number;
    ua: string;
}

export interface IEventSummary {
    event: Event;
    start: number;
    end: number;
}
