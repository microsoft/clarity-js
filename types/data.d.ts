export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

export const enum Event {
    Metadata,
    Discover,
    Mutation,
    Metrics,
    Mouse,
    Touch,
    Keyboard,
    Selection,
    Resize,
    Scroll,
    Document,
    Visibility,
    Network,
    Performance
}

export const enum Flush {
    Schedule,
    Force,
    None
}

export interface IEvent {
    t: number;
    e: Event;
    d: Token[];
}

export interface IPayload {
    t: number;
    n: number;
    v: string;
    p: string;
    u: string;
    s: string;
    m: string;
    d: string;
}

export interface IDecodedEvent {
    time: number;
    event: Event;
    data: any;
}

export interface IMetadata {
    version: string;
    pageId: string;
    userId: string;
    siteId: string;
    url: string;
    title: string;
}
