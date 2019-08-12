import Metric from "../src/metrics/metric";
import { Token } from "../types/data";
import { IMetric, MetricType } from "../types/metrics";

export default function(tokens: Token[]): IMetric {
    let metrics: IMetric = { counter: {}, timing: {}, summary: {}, events: [], marks: [] };

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
                metrics.counter[tokens[i++] as Metric] = tokens[i++] as number;
                break;
            case MetricType.Timing:
                metrics.timing[tokens[i++] as Metric] = { duration: tokens[i++] as number, count: tokens[i++] as number };
                break;
            case MetricType.Summary:
                metrics.summary[tokens[i++] as Metric] = {
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
