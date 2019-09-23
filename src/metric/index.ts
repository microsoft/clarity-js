import { IMetric, Metric } from "@clarity-types/metric";

export let metrics: IMetric = null;
export let updates: Metric[] = [];

export function start(): void {
    metrics = {};
}

export function end(): void {
    metrics = null;
}

export function counter(metric: Metric, increment: number = 1): void {
    if (!(metric in metrics)) { metrics[metric] = 0; }
    metrics[metric] += increment;
    track(metric);
}

export function measure(metric: Metric, value: number): void {
    if (!(metric in metrics)) { metrics[metric] = 0; }
    metrics[metric] = Math.max(value, metrics[metric]);
    track(metric);
}

function track(metric: Metric): void {
    if (updates.indexOf(metric) === -1) {
        updates.push(metric);
    }
}

export function reset(): void {
    updates = [];
}
