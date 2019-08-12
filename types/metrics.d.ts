export const enum MetricType {
    Counter = "C",
    Timing = "T",
    Summary = "S",
    Events = "E",
    Marks = "M"
}

export interface IMetric {
    timing: ITiming;
    counter: ICounter;
    summary: ISummary;
    events: ISemanticEvent[];
    marks: IMark[];
}

export interface ITiming {
    [key: number]: {
        duration: number;
        count: number;
    };
}

export interface ICounter {
    [key: number]: number;
}

export interface ISummary {
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
