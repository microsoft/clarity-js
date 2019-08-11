// Metric Names
export const enum Metric {
    Timer = "t",
    Counter = "c",
    Histogram = "h",
    Mark = "m"
}

export const enum Timer {
    Discover = "dt",
    Mutation = "mt",
    Wireup = "wt",
    Active = "at"
}

export const enum Counter {
    Nodes = "nc",
    Bytes = "bc",
    Mutations = "mc",
    Swipes = "sc",
}

export const enum Histogram {
    PointerDistance = "ph",
    ViewportX = "xh",
    ViewportY = "yh",
    ViewportWidth = "wh",
    ViewportHeight = "hh",
    DocumentWidth = "dwh",
    DocumentHeight = "dhh"
}

export const enum Mark {
    Click = "cm",
    Error = "em",
    Interaction = "im"
}

// Counter
export interface ICounter {
    [key: number]: number;
}

// Histogram
export interface IHistogram {
    [key: number]: [number];
}

export interface IHistogramSummary {
    [key: string]: IHistogramSummaryValue;
}

interface IHistogramSummaryValue {
    sum: number;
    min: number;
    max: number;
    count: number;
    sumsquared: number;
}

// Mark
export interface IMark {
    mark: string;
    start: number;
    end: number;
}

// Timer
export interface ITimer {
    [key: number]: [number];
}

export interface ITimerSummary {
    [key: number]: ITimerSummaryValue;
}

interface ITimerSummaryValue {
    duration: number;
    count: number;
}
