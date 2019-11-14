import { AsyncTask, TaskFunction, TaskResolve } from "@clarity-types/core";
import { Metric } from "@clarity-types/data";
import config from "@src/core/config";
import * as metric from "@src/data/metric";

let tracker: { [key: number]: number } = {};
let counter: { [key: number]: number } = {};
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

    // If the task queue is empty, invoke the first task in the queue synchronously
    // This also ensures we don't yield the thread during unload event
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

export function blocking(method: Metric): boolean {
    let elapsed = performance.now() - tracker[method];
    return (elapsed > config.longtask);
}

export function start(method: Metric, resume: boolean = false): void {
    tracker[method] = performance.now();
    counter[method] = resume ? counter[method] + 1 : 0;
}

export function stop(method: Metric, pause: boolean = false): void {
    let end = performance.now();
    let duration = end - tracker[method];
    metric.accumulate(method, duration);
    metric.count(Metric.InvokeCount);

    // For the first execution, which is synchronous, time is automatically counted towards TotalDuration.
    // However, for subsequent asynchronous runs, we need to manually update TotalDuration metric.
    if (counter[method] > 0) { metric.accumulate(Metric.TotalDuration, duration); }
}

export async function idle(method: Metric): Promise<void> {
    stop(method, true);
    await wait();
    start(method, true);
}

async function wait(): Promise<number> {
    return new Promise<number>((resolve: FrameRequestCallback): void => {
        requestAnimationFrame(resolve);
    });
}
