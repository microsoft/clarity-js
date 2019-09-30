export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

/* Enum */

export const enum Event {
    Metric = 0,
    Discover = 1,
    Mutation = 2,
    BoxModel = 3,
    Hash = 4,
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
    InputChange = 24,
    Visible = 25,
    Network = 26,
    Performance = 27,
    ScriptError = 28,
    ImageError = 29,
    Resource = 30,
    Summary = 31,
    Upload = 32
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

export const enum BooleanFlag {
    False = 0,
    True = 1
}

/* Helper Interfaces */

export interface Payload {
    e: Token[];
    d: Token[][];
}

export interface EncodedPayload {
    e: string;
    d: string;
}

export interface CookieInfo {
    userId: string;
    sessionId: string;
    timestamp: number;
}

export interface ClarityInfo {
    userId: string;
    sessionId: string;
    pageId: string;
}

export interface Metadata {
    page: PageData;
    envelope: Envelope;
}

export interface Envelope {
    sequence: number;
    version: string;
    projectId: string;
    userId: string;
    sessionId: string;
    pageId: string;
    upload: Upload;
    end: BooleanFlag;
}

export interface Transit {
    [key: number]: {
        data: string;
        attempts: number;
    };
}

/* Event Data */

export interface MetricData {
    [key: number]: number;
}

export interface PageData {
    timestamp: number;
    ua: string;
    url: string;
    referrer: string;
    lean: BooleanFlag;
}

export interface PingData {
    gap: number;
}

export interface TagData {
    key: string;
    value: string;
}

export interface UploadData {
    sequence: number;
    attempts: number;
    status: number;
}

export interface SummaryData {
    event: Event;
    start: number;
    end: number;
}
