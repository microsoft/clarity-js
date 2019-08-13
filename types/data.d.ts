import { IMetric } from "./metrics";

export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

export const enum Event {
    Metadata,
    Discover,
    Mutation,
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
    e: Token[];
    m: Token[];
    d: IEvent[];
}

export interface IDecodedPayload {
    envelope: IEnvelope;
    metrics: IMetric;
    data: IDecodedEvent[];
}

export interface IDecodedEvent {
    time: number;
    event: Event;
    data: any;
}

export interface IEnvelope {
    sequence: number;
    version: string;
    pageId: string;
    userId: string;
    projectId: string;
}

export interface IMetadata extends IEnvelope {
    url: string;
    title: string;
}
