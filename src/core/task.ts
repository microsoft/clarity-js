import {ITask } from "@clarity-types/core";
import { Timer } from "@clarity-types/metrics";
import config from "@src/core/config";
import * as timer from "@src/metrics/timer";

let tracker: ITask = {};
let threshold = config.longtask;

export function longtask(method: Timer): boolean {
    let elapsed = Date.now() - tracker[method];
    return (elapsed > threshold);
}

export function start(method: Timer): void {
    if (!(method in tracker)) {
        tracker[method] = 0;
    }
    tracker[method] = Date.now();
}

export function stop(method: Timer): void {
    let end = Date.now();
    let duration = end - tracker[method];
    timer.observe(method, duration);
}

export async function idle(method: Timer): Promise<void> {
    stop(method);
    await wait();
    start(method);
}

async function wait(): Promise<number> {
    return new Promise<number>((resolve: FrameRequestCallback): void => {
        requestAnimationFrame(resolve);
    });
}
