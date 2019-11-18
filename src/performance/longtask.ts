import { Event } from "@clarity-types/data";
import { LongTaskState } from "@clarity-types/performance";
import encode from "./encode";

export let state: LongTaskState = null;

export function reset(): void {
    state = null;
}

export function compute(entry: PerformanceEntry): void {
    state = { time: Math.round(entry.startTime), data: { duration: Math.round(entry.duration) } };
    encode(Event.LongTask);
}
