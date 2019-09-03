import { Event, Token } from "../types/data";
import { IDecodedMetric, IMetricMap, Metric, MetricType } from "../types/metric";

let metricMap: IMetricMap = {};

metricMap[Metric.Nodes] = { name: "Node Count", unit: ""};
metricMap[Metric.Bytes] = { name: "Byte Count", unit: "KB"};
metricMap[Metric.Mutations] = { name: "Mutation Count", unit: ""};
metricMap[Metric.Interactions] = { name: "Interaction Count", unit: ""};
metricMap[Metric.Clicks] = { name: "Click Count", unit: ""};
metricMap[Metric.Selections] = { name: "Selection Count", unit: ""};
metricMap[Metric.ScriptErrors] = { name: "Script Errors", unit: ""};
metricMap[Metric.ImageErrors] = { name: "Image Errors", unit: ""};
metricMap[Metric.DiscoverTime] = { name: "Discover Time", unit: "ms"};
metricMap[Metric.MutationTime] = { name: "Mutation Time", unit: "ms"};
metricMap[Metric.BoxModelTime] = { name: "Box Model Time", unit: "ms"};
metricMap[Metric.WireupTime] = { name: "Wireup Delay", unit: "s"};
metricMap[Metric.ActiveTime] = { name: "Active Time", unit: "ms"};
metricMap[Metric.ViewportWidth] = { name: "Viewport Width", unit: "px"};
metricMap[Metric.ViewportHeight] = { name: "Viewport Height", unit: "px"};
metricMap[Metric.DocumentWidth] = { name: "Document Width", unit: "px"};
metricMap[Metric.DocumentHeight] = { name: "Document Height", unit: "px"};

let metrics: IDecodedMetric = { counters: {}, measures: {}, events: [], marks: [] };

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
                let counter = metricMap[tokens[i++] as Metric];
                metrics.counters[counter.name] = { value: tokens[i++] as number, unit: counter.unit };
                break;
            case MetricType.Measure:
                let measure = metricMap[tokens[i++] as Metric];
                metrics.measures[measure.name] = { value: tokens[i++] as number, unit: measure.unit };
                break;
            case MetricType.Event:
                metrics.events.push({ event: tokens[i++] as Event, time: tokens[i++] as number, duration: tokens[i++] as number });
                break;
            case MetricType.Marks:
                metrics.marks.push({ key: tokens[i++] as string, value: tokens[i++] as string, time: tokens[i++] as number });
                break;
        }
    }

    return metrics;
}
