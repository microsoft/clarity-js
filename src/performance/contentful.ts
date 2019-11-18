import { Event } from "@clarity-types/data";
import { LargestContentfulData, LargestContentfulPaint } from "@clarity-types/performance";
import { schedule } from "@src/core/task";
import encode from "./encode";

export let data: LargestContentfulData = null;

export function reset(): void {
    data = null;
}

export function compute(entry: LargestContentfulPaint): void {
    data = {
        load: Math.round(entry.loadTime),
        render: Math.round(entry.renderTime),
        size: entry.size,
        target: entry.element
    };
    schedule(encode.bind(this, Event.Contentful));
}
