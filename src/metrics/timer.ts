import {ITimer, ITimerSummary} from "@clarity-types/metrics";
import {Timer} from "./enums";

let tracker: ITimer = {};
let summary: ITimerSummary = {};
let threshold = 50;
window["TRACKER"] = tracker; // DEBUG: Remove later

export function longtasks(method: Timer): boolean {
    let elapsed = Date.now() - tracker[method].start;
    return (elapsed > threshold);
}

export function start(method: Timer): void {
    if (!(method in tracker)) {
        tracker[method] = { start: 0, end: 0, duration: 0, count: 0 };
    }
    tracker[method].start = Date.now();
}

export function stop(method: Timer): void {
    tracker[method].end = Date.now();
    tracker[method].duration += tracker[method]["end"] - tracker[method]["start"];
    tracker[method].count++;
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

export function summarize(): ITimerSummary {
    for (let key in tracker) {
        if (tracker[key].updated) {
            summary[key] = { duration: tracker[key].duration, count: tracker[key].count };
            tracker[key].updated = false;
        }
    }
    return summary;
}
