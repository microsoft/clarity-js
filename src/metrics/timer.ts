import { ITimer, ITimerSummary, Timer } from "@clarity-types/metrics";

let tracker: ITimer = {};
let summary: ITimerSummary = {};

export function observe(key: Timer, value: number): void {
    if (!(key in tracker)) {
        tracker[key] = [];
    }
    tracker[key].push(value);
}

export function summarize(): ITimerSummary {
    for (let key in tracker) {
        if (tracker[key]) {
            summary[key] = { duration: 0, count: 0 };
            for (let value of tracker[key]) {
                summary[key].duration += value;
                summary[key].count++;
            }
        }
    }
    return summary;
}
