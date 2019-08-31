import { Event } from "@clarity-types/data";
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
    if (!(metric in metrics.measures)) { metrics.measures[metric] = 0; }
    metrics.measures[metric] = Math.max(value, metrics.measures[metric]);
    track(metric);
}

export function event(evt: Event, begin: number, duration: number = 0): void {
    metrics.events.push({ event: evt, time: begin, duration });
}

export function mark(key: string, value: string): void {
    metrics.marks.push({ key, value, time: time() });
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
