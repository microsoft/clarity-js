import { Token } from "../types/data";
import { IMetric, Metric, MetricType } from "../types/metric";

let metrics: IMetric = null;

export default function(tokens: Token[]): IMetric {
    let i = 0;
    let metricType = null;
    metrics = { counters: {}, measures: {}, tags: [] };
    while (i < tokens.length) {
        // Determine metric time for subsequent processing
        if (typeof(tokens[i]) === "string") {
            metricType = tokens[i++];
            continue;
        }

        // Parse metrics
        switch (metricType) {
            case MetricType.Counter:
                let counter = tokens[i++] as Metric;
                metrics.counters[counter] = tokens[i++] as number;
                break;
            case MetricType.Measure:
                let measure = tokens[i++] as Metric;
                metrics.measures[measure] = tokens[i++] as number;
                break;
            case MetricType.Tag:
                metrics.tags.push({ key: tokens[i++] as string, value: tokens[i++] as string, time: tokens[i++] as number });
                break;
        }
    }

    return metrics;
}
