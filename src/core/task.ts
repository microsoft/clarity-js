import {ITask } from "@clarity-types/core";
import config from "@src/core/config";
import * as metrics from "@src/metrics";
import Metric from "@src/metrics/metric";

let tracker: ITask = {};
let threshold = config.longtask;

export function longtask(method: Metric): boolean {
    let elapsed = Date.now() - tracker[method];
    return (elapsed > threshold);
}

export function start(method: Metric): void {
    if (!(method in tracker)) {
        tracker[method] = 0;
    }
    tracker[method] = Date.now();
}

export function stop(method: Metric): void {
    let end = Date.now();
    let duration = end - tracker[method];
    metrics.timing(method, duration);
}

export async function idle(method: Metric): Promise<void> {
    stop(method);
    await wait();
    start(method);
}

async function wait(): Promise<number> {
    return new Promise<number>((resolve: FrameRequestCallback): void => {
        requestAnimationFrame(resolve);
    });
}
