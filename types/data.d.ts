import { IDecodedMetric } from "./metric";

export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

export const enum Event {
    Metadata,
    Discover,
    Mutation,
    BoxModel,
    Mouse,
    Touch,
    Keyboard,
    Selection,
    Resize,
    Scroll,
    Document,
    Visibility,
    Network,
    Performance,
    ScriptError,
    ImageError
}

export const enum Flush {
    Schedule,
    Force,
    None
}

export interface IPayload {
    e: Token[];
    m: Token[];
    d: Token[][];
}

export interface IDecodedPayload {
    envelope: IEnvelope;
    metrics: IDecodedMetric;
    events: IDecodedEvent[];
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
    referrer: string;
}
