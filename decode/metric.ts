import { Token } from "../types/data";
import { IDecodedMetric, IMetricMap, Metric, MetricType } from "../types/metric";

let map: IMetricMap = {};

map[Metric.Nodes] = { name: "Node Count", unit: ""};
map[Metric.Bytes] = { name: "Byte Count", unit: "KB"};
map[Metric.Mutations] = { name: "Mutation Count", unit: ""};
map[Metric.Interactions] = { name: "Interaction Count", unit: ""};
map[Metric.Clicks] = { name: "Click Count", unit: ""};
map[Metric.ScriptErrors] = { name: "Script Errors", unit: ""};
map[Metric.ImageErrors] = { name: "Image Errors", unit: ""};
map[Metric.DiscoverTime] = { name: "Discover Time", unit: "ms"};
map[Metric.MutationTime] = { name: "Mutation Time", unit: "ms"};
map[Metric.BoxModelTime] = { name: "Box Model Time", unit: "ms"};
map[Metric.WireupTime] = { name: "Wireup Delay", unit: "s"};
map[Metric.ActiveTime] = { name: "Active Time", unit: "ms"};
map[Metric.ViewportWidth] = { name: "Viewport Width", unit: "px", value: "max"};
map[Metric.ViewportHeight] = { name: "Viewport Height", unit: "px", value: "max"};
map[Metric.DocumentWidth] = { name: "Document Width", unit: "px", value: "max"};
map[Metric.DocumentHeight] = { name: "Document Height", unit: "px", value: "max"};
map[Metric.ClickEvent] = { name: "Click Event", unit: ""};
map[Metric.InteractionEvent] = { name: "Interaction Event", unit: ""};

let metrics: IDecodedMetric = { counters: {}, measures: {}, events: [], marks: [], map };

export default function(tokens: Token[]): IDecodedMetric {
    let i = 0;
    let metricType = null;
    while (i < tokens.length) {
        // Determine metric time for subsequent processing
        if (typeof(tokens[i]) === "string") {
            metricType = tokens[i++];
            continue;
        }

        // Parse metrics
        switch (metricType) {
            case MetricType.Counter:
                metrics.counters[tokens[i++] as Metric] = tokens[i++] as number;
                break;
            case MetricType.Summary:
                metrics.measures[tokens[i++] as Metric] = {
                    sum: tokens[i++] as number,
                    min: tokens[i++] as number,
                    max: tokens[i++] as number,
                    sumsquared: tokens[i++] as number,
                    count: tokens[i++] as number,
                };
                break;
            case MetricType.Events:
                metrics.events.push({ metric: tokens[i++] as Metric, time: tokens[i++] as number, duration: tokens[i++] as number });
                break;
            case MetricType.Marks:
                metrics.marks.push({ name: tokens[i++] as string, time: tokens[i++] as number });
                break;
        }
    }

    return metrics;
}
