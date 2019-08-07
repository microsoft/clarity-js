export type Token = (string | number | number[] | string[]);
export type DecodedToken = (any | any[]);

export const enum Event {
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
    p: string;
    s: string;
    t: string;
    n: number;
    d: string;
}

export interface IDecodedEvent {
    time: number;
    event: Event;
    data: DecodedToken[];
}
