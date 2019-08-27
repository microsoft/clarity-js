export const enum MetricType {
    Counter = "C",
    Timing = "T",
    Summary = "S",
    Events = "E",
    Marks = "M"
}

export const enum Metric {
    /* Counter */
    Nodes,
    Bytes,
    Mutations,
    Interactions,
    Clicks,
    ScriptErrors,
    ImageErrors,
    DiscoverTime,
    MutationTime,
    BoxModelTime,
    WireupTime,
    ActiveTime,
    /* Summary */
    ViewportWidth,
    ViewportHeight,
    DocumentWidth,
    DocumentHeight,
    /* Semantic Events */
    ClickEvent,
    InteractionEvent
}

export interface IMetricMap {
    [key: number]: IMetricMapValue;
}

export interface IMetricMapValue {
    name: string;
    unit: string;
    value?: string;
}

export interface IMetric {
    counters: ICounter;
    measures: IMeasure;
    events: ISemanticEvent[];
    marks: IMark[];
}

export interface IDecodedMetric extends IMetric {
    map: IMetricMap;
}

export interface ICounter {
    [key: number]: number;
}

export interface IMeasure {
    [key: number]: {
        sum: number;
        min: number;
        max: number;
        count: number;
        sumsquared: number;
    };
}

export interface ISemanticEvent {
    metric: number;
    time: number;
    duration: number;
}

export interface IMark {
    name: string;
    time: number;
}
