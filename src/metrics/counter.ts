import {Counter} from "./enums";

interface ICounter {
    [key: number]: ICounterValue;
}

interface ICounterValue {
    updated: boolean;
    counter: number;
}

interface ICounterSummary {
    [key: string]: ICounterSummaryValue;
}
interface ICounterSummaryValue {
    counter: number;
}

let tracker: ICounter = {};
let summary: ICounterSummary = {};

export function increment(key: Counter, counter: number = 1): void {
    if (!(key in tracker)) {
        tracker[key] = { updated: true, counter };
    }
    tracker[key].updated = true;
    tracker[key].counter += counter;
}

export function summarize(): ICounterSummary {
    for (let key in tracker) {
        if (tracker[key].updated) {
            summary[key] = { counter: tracker[key].counter };
            tracker[key].updated = false;
        }
    }
    return summary;
}
