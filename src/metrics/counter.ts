import { Counter, ICounter } from "@clarity-types/metrics";

export let data: ICounter = {};

export function increment(key: Counter, counter: number = 1): void {
    if (!(key in data)) {
        data[key] = { updated: true, counter };
    }
    data[key].updated = true;
    data[key].counter += counter;
}
