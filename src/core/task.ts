import { IAsyncTask, ITaskTracker, TaskCallback, TaskFunction } from "@clarity-types/core";
import {Token } from "@clarity-types/data";
import { Metric } from "@clarity-types/metric";
import config from "@src/core/config";
import * as metrics from "@src/metric";

let tracker: ITaskTracker = {};
let threshold = config.longtask;
let queue: IAsyncTask[] = [];
let active: IAsyncTask = null;

export async function schedule(task: TaskFunction, callback: TaskCallback): Promise<void> {
    // If this task is already scheduled, skip it
    for (let q of queue) {
        if (q.task === task) {
            return;
        }
    }

    // Otherwise, add thit to the queue
    queue.push({task, callback});
    if (active === null) { run(); }
}

function run(): void {
    let entry = queue.shift();
    if (entry) {
        active = entry;
        entry.task().then((data: Token[]) => {
            entry.callback(data);
            active = null;
            run();
        });
    }
}

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
    metrics.counter(method, duration);
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
