// Metric Names
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
    Interaction = "ic"
}

// Counter
export interface ICounter {
    [key: number]: ICounterValue;
}

interface ICounterValue {
    updated: boolean;
    counter: number;
}

export interface ICounterSummary {
    [key: string]: ICounterSummaryValue;
}

interface ICounterSummaryValue {
    counter: number;
}

// Histogram
export interface IHistogram {
    [key: number]: IHistogramValue;
}

interface IHistogramValue {
    updated: boolean;
    values: [number];
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
    updated: boolean;
    start: number;
    end: number;
}

export interface IMarkSummary {
    mark: string;
    start: number;
    end: number;
}

// Timer
export interface ITimer {
    [key: number]: ITimerValue;
}

interface ITimerValue {
    updated: boolean;
    start: number;
    end: number;
    duration: number;
    count: number;
}

export interface ITimerSummary {
    [key: number]: ITimerSummaryValue;
}

interface ITimerSummaryValue {
    duration: number;
    count: number;
}
