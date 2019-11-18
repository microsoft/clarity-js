import { Event } from "@clarity-types/data";
import { PaintState } from "@clarity-types/performance";
import encode from "./encode";

export let state: PaintState = null;

export function reset(): void {
    state = null;
}

export function compute(entry: PerformanceEntry): void {
    state = { time: Math.round(entry.startTime), data: { name: entry.name } };
    encode(Event.Paint);
}
