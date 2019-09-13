import { IAsyncTask, ITaskTracker, TaskFunction, TaskResolve } from "@clarity-types/core";
import { Metric } from "@clarity-types/metric";
import config from "@src/core/config";
import * as metrics from "@src/metric";

let tracker: ITaskTracker = {};
let threshold = config.longtask;
let queue: IAsyncTask[] = [];
let active: IAsyncTask = null;

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

    if (active === null) { run(); }

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
