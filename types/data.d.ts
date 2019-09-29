export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

/* Enum */

export const enum Event {
    Metric = 0,
    Discover = 1,
    Mutation = 2,
    BoxModel = 3,
    Checksum = 4,
    Resize = 5,
    Document = 6,
    Scroll = 7,
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
    Page = 20,
    Tag = 21,
    Ping = 22,
    Unload = 23,
    Change = 24,
    Visibility = 25,
    Network = 26,
    Performance = 27,
    ScriptError = 28,
    ImageError = 29,
    Resource = 30,
    Summary = 31
}

export const enum Metric {
    Nodes = 0,
    LayoutBytes = 1,
    InteractionBytes = 2,
    NetworkBytes = 3,
    DiagnosticBytes = 4,
    Mutations = 5,
    Interactions = 6,
    Clicks = 7,
    Selections = 8,
    Changes = 9,
    ScriptErrors = 10,
    ImageErrors = 11,
    DiscoverTime = 12,
    MutationTime = 13,
    BoxModelTime = 14,
    StartTime = 15,
    ActiveTime = 16,
    EndTime = 17,
    ViewportWidth = 18,
    ViewportHeight = 19,
    DocumentWidth = 20,
    DocumentHeight = 21
}

export const enum Upload {
    Async = 0,
    Beacon = 1,
    Backup = 2
}

export const enum State {
    False = 0,
    True = 1
}

/* Helper Interfaces */

export interface IPayload {
    e: Token[];
    d: Token[][];
}

export interface IEncodedPayload {
    e: string;
    d: string;
}

export interface ICookieInfo {
    userId: string;
    sessionId: string;
    timestamp: number;
}

export interface IClarityInfo {
    userId: string;
    sessionId: string;
    pageId: string;
}

export interface IMetadata {
    page: IPageData;
    envelope: IEnvelope;
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
    end: State;
}

export interface IAugmentation {
    timestamp: number;
    ua: string;
}

/* Event Data */

export interface IMetricData {
    [key: number]: number;
}

export interface IPageData {
    timestamp: number;
    elapsed: number;
    url: string;
    referrer: string;
    lean: State;
}

export interface IPingData {
    gap: number;
}

export interface ITagData {
    key: string;
    value: string;
}

export interface ISummaryData {
    event: Event;
    start: number;
    end: number;
}
