import { ITimer, ITimerSummary, Timer } from "@clarity-types/metrics";

let tracker: ITimer = {};
let summary: ITimerSummary = {};

export function observe(key: Timer, value: number): void {
    if (!(key in tracker)) {
        tracker[key] = { updated: true, values: [] };
    }
    tracker[key].updated = true;
    tracker[key].values.push(value);
}

export function summarize(): ITimerSummary {
    for (let key in tracker) {
        if (tracker[key]) {
            summary[key] = { duration: 0, count: 0 };
            for (let value of tracker[key].values) {
                summary[key].duration += value;
                summary[key].count++;
            }
            tracker[key].updated = false;
        }
    }
    return summary;
}
