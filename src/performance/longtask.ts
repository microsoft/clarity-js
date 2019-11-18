import { Event } from "@clarity-types/data";
import { LongTaskEntry, LongTaskState } from "@clarity-types/performance";
import encode from "./encode";

// Reference: https://w3c.github.io/longtasks/#sec-PerformanceLongTaskTiming
export let state: LongTaskState = null;

export function reset(): void {
    state = null;
}

export function compute(entry: LongTaskEntry): void {
    state = { time: Math.round(entry.startTime),
        data: {
            duration: Math.round(entry.duration),
            attribution: entry.attribution
        }
    };
    encode(Event.LongTask);
}
