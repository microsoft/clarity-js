import { IMetric, Metric } from "@clarity-types/metric";
import time from "@src/core/time";

export let metrics: IMetric = null;
export let updates: Metric[] = [];

export function start(): void {
    metrics = { counters: {}, measures: {}, events: [], marks: [] };
}

export function end(): void {
    metrics = null;
}

export function counter(metric: Metric, increment: number = 1): void {
    if (!(metric in metrics.counters)) { metrics.counters[metric] = 0; }
    metrics.counters[metric] += increment;
    track(metric);
}

export function measure(metric: Metric, value: number): void {
    if (!(metric in metrics.measures)) { metrics.measures[metric] = { sum: 0, min: null, max: null, sumsquared: 0, count: 0 }; }
    metrics.measures[metric].sum += value;
    metrics.measures[metric].min = metrics.measures[metric].min !== null ? Math.min(metrics.measures[metric].min, value) : value;
    metrics.measures[metric].max = metrics.measures[metric].max !== null ? Math.max(metrics.measures[metric].max, value) : value;
    metrics.measures[metric].sumsquared += (value * value);
    metrics.measures[metric].count++;
    track(metric);
}

export function event(metric: Metric, begin: number, duration: number = 0): void {
    metrics.events.push({ metric, time: begin, duration });
}

export function mark(name: string): void {
    metrics.marks.push({ name, time: time() });
}

function track(metric: Metric): void {
    if (updates.indexOf(metric) === -1) {
        updates.push(metric);
    }
}

export function reset(): void {
    updates = [];
    metrics.events = [];
    metrics.marks = [];
}
