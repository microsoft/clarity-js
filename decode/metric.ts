import { Token } from "../types/data";
import { IDecodedMetric, IMetricMap, Metric, MetricType } from "../types/metric";

let map: IMetricMap = {};

map[Metric.NodeCount] = { name: "Node Count", unit: ""};
map[Metric.ByteCount] = { name: "Byte Count", unit: "KB"};
map[Metric.MutationCount] = { name: "Mutation Count", unit: ""};
map[Metric.InteractionCount] = { name: "Interaction Count", unit: ""};
map[Metric.ClickCount] = { name: "Click Count", unit: ""};
map[Metric.ScriptErrorCount] = { name: "Script Errors", unit: ""};
map[Metric.ImageErrorCount] = { name: "Image Errors", unit: ""};
map[Metric.DiscoverTime] = { name: "Discover Time", unit: "ms"};
map[Metric.MutationTime] = { name: "Mutation Time", unit: "ms"};
map[Metric.WireupLag] = { name: "Wireup Delay", unit: "ms"};
map[Metric.ActiveTime] = { name: "Active Time", unit: "ms"};
map[Metric.ViewportWidth] = { name: "Viewport Width", unit: "px", value: "max"};
map[Metric.ViewportHeight] = { name: "Viewport Height", unit: "px", value: "max"};
map[Metric.DocumentWidth] = { name: "Document Width", unit: "px", value: "max"};
map[Metric.DocumentHeight] = { name: "Document Height", unit: "px", value: "max"};
map[Metric.ClickEvent] = { name: "Click Event", unit: ""};
map[Metric.InteractionEvent] = { name: "Interaction Event", unit: ""};

export default function(tokens: Token[]): IDecodedMetric {
    let metrics: IDecodedMetric = { counters: {}, measures: {}, events: [], marks: [], map };

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
