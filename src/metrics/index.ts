import { IMetric } from "@clarity-types/metrics";
import time from "@src/core/time";
import Metric from "@src/metrics/metric";
import encode from "./encode";

export let metrics: IMetric = null;

export function start(): void {
    metrics = { counter: {}, timing: {}, summary: {}, events: [], marks: [] };
}

export function end(): void {
    metrics = null;
}

export function compute(): string {
    return JSON.stringify(encode());
}

export function counter(metric: Metric, increment: number = 1): void {
    if (!(metric in metrics.counter)) { metrics.counter[metric] = 0; }
    metrics.counter[metric] += increment;
}

export function timing(metric: Metric, duration: number): void {
    if (!(metric in metrics.timing)) { metrics.timing[metric] = { duration: 0, count: 0 }; }
    metrics.timing[metric].duration += duration;
    metrics.timing[metric].count++;
}

export function summary(metric: Metric, value: number): void {
    if (!(metric in metrics.summary)) { metrics.summary[metric] = { sum: 0, min: null, max: null, sumsquared: 0, count: 0 }; }
    metrics.summary[metric].sum += value;
    metrics.summary[metric].min = metrics.summary[metric].min !== null ? Math.min(metrics.summary[metric].min, value) : value;
    metrics.summary[metric].max = metrics.summary[metric].max !== null ? Math.max(metrics.summary[metric].max, value) : value;
    metrics.summary[metric].sumsquared += value;
    metrics.summary[metric].count++;
}

export function event(metric: Metric, begin: number, duration: number = 0): void {
    metrics.events.push({ metric, time: begin, duration });
}

export function mark(name: string): void {
    metrics.marks.push({ name, time: time() });
}
