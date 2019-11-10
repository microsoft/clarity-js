import { AsyncTask, TaskFunction, TaskResolve, TaskTiming } from "@clarity-types/core";
import { Metric } from "@clarity-types/data";
import config from "@src/core/config";
import * as metric from "@src/data/metric";

let tracker: TaskTiming = {};
let queue: AsyncTask[] = [];
let active: AsyncTask = null;

export async function schedule(task: TaskFunction): Promise<void> {
    // If this task is already scheduled, skip it
    for (let q of queue) {
        if (q.task === task) {
            return;
        }
    }

    let promise = new Promise<void>((resolve: TaskResolve): void => {
        queue.push({task, resolve});
    });

    if (active === null) { requestAnimationFrame(run); }

    return promise;
}

function run(): void {
    let entry = queue.shift();
    if (entry) {
        active = entry;
        entry.task().then(() => {
            entry.resolve();
            active = null;
            run();
        });
    }
}

export function blocking(method: Metric): boolean {
    let elapsed = performance.now() - tracker[method];
    return (elapsed > config.longtask);
}

export function start(method: Metric): void {
    tracker[method] = performance.now();
}

export function stop(method: Metric): void {
    let end = performance.now();
    let duration = end - tracker[method];
    metric.duration(method, duration);
    metric.duration(Metric.Latency, duration);
    metric.counter(Metric.InvokeCount);
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
