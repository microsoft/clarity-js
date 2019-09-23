import { Event } from "./data";

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

export interface IMetric {
    [key: number]: number;
}
