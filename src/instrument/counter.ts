import {Method} from "../lib/enums";

interface ICounter {
    [key: number]: ICounterValue;
}

interface ICounterValue {
    start: number;
    end: number;
    duration: number;
    count: number;
}

let tracker: ICounter = {};
window["TRACKER"] = tracker; // DEBUG: Remove later
let threshold = 50;

export function longtasks(method: Method): boolean {
    let elapsed = Date.now() - tracker[method].start;
    return (elapsed > threshold);
}

export function start(method: Method): void {
    if (!(method in tracker)) {
        tracker[method] = { start: 0, end: 0, duration: 0, count: 0 };
    }
    tracker[method].start = Date.now();
}

export function stop(method: Method): void {
    tracker[method].end = Date.now();
    tracker[method].duration += tracker[method]["end"] - tracker[method]["start"];
    tracker[method].count++;
}

export async function idle(method: Method): Promise<void> {
    stop(method);
    await wait();
    start(method);
}

async function wait(): Promise<number> {
    return new Promise<number>((resolve: FrameRequestCallback): void => {
        requestAnimationFrame(resolve);
    });
}
