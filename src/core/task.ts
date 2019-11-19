import { AsyncTask, TaskFunction, TaskResolve } from "@clarity-types/core";
import { Metric } from "@clarity-types/data";
import config from "@src/core/config";
import * as metric from "@src/data/metric";

// Track the start time to be able to compute duration at the end of the task
let tracker: { [key: number]: number } = {};
// Keep a count of number of async calls a particular task required
let counter: { [key: number]: number } = {};
let queue: AsyncTask[] = [];
let active: AsyncTask = null;

export function reset(): void {
    tracker = {};
    counter = {};
    queue = [];
    active = null;
}

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

    // If there is no active task running, invoke the first task in the queue synchronously
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
            active = null; // Reset active task back to null now that the promise is resolved
            run();
        });
    }
}

export function shouldYield(method: Metric): boolean {
    let elapsed = performance.now() - tracker[method];
    return (elapsed > config.longtask);
}

export function start(method: Metric): void {
    tracker[method] = performance.now();
    counter[method] = 0;
}

function resume(method: Metric): void {
    let c = counter[method];
    start(method);
    counter[method] = c + 1;
}

export function stop(method: Metric): void {
    let end = performance.now();
    let duration = end - tracker[method];
    metric.accumulate(method, duration);
    metric.count(Metric.InvokeCount);

    // For the first execution, which is synchronous, time is automatically counted towards TotalDuration.
    // However, for subsequent asynchronous runs, we need to manually update TotalDuration metric.
    if (counter[method] > 0) { metric.accumulate(Metric.TotalDuration, duration); }
}

export async function pause(method: Metric): Promise<void> {
    // Pause and yield the thread only if the task is still being tracked
    // It's possible that Clarity is wrapping up instrumentation on a page and we are still in the middle of an async task.
    // In that case, we do not wish to continue yielding thread.
    // Instead, we will turn async task into a sync task and maximize our chances of getting some data back.
    if (method in tracker) {
        stop(method);
        await wait();
        resume(method);
    }
}

async function wait(): Promise<number> {
    return new Promise<number>((resolve: FrameRequestCallback): void => {
        requestAnimationFrame(resolve);
    });
}
