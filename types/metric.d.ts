import { Event } from "./data";

export const enum MetricType {
    Counter = "C",
    Measure = "M",
    Event = "E",
    Marks = "K"
}

export const enum Metric {
    /* Counter */
    Nodes,
    LayoutBytes,
    InteractionBytes,
    NetworkBytes,
    DiagnosticBytes,
    Mutations,
    Interactions,
    Clicks,
    Selections,
    Changes,
    ScriptErrors,
    ImageErrors,
    DiscoverTime,
    MutationTime,
    BoxModelTime,
    LoadTime,
    ActiveTime,
    UnloadTime,
    /* Measures */
    ViewportWidth,
    ViewportHeight,
    DocumentWidth,
    DocumentHeight
}

export interface IMetric {
    counters: IMetricValue;
    measures: IMetricValue;
    events: IEventMetric[];
    marks: IMarkMetric[];
}

export interface IMetricValue {
    [key: number]: number;
}

export interface IEventMetric {
    event: Event;
    time: number;
    duration: number;
}

export interface IMarkMetric {
    key: string;
    value: string;
    time: number;
}

export interface IMetricMap {
    [key: number]: IMetricMapValue;
}

export interface IMetricMapValue {
    name: string;
    unit: string;
}

export interface IDecodedMetric {
    counters: IDecodedMetricValue;
    measures: IDecodedMetricValue;
    events: IEventMetric[];
    marks: IMarkMetric[];
}

export interface IDecodedMetricValue {
    [key: string]: {
        value: number;
        unit: string;
    };
}
