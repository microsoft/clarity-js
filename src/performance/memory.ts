import { Event } from "@clarity-types/data";
import { MemoryData, PerformanceMemory } from "@clarity-types/performance";
import encode from "./encode";

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
export let data: MemoryData = null;

export function reset(): void {
    data = null;
}

export function compute(): void {
    // Reference: https://trackjs.com/blog/monitoring-javascript-memory/
    // At the moment, this is available in Chrome only.
    if (performance && "memory" in performance) {
        let memory = (performance["memory"] as PerformanceMemory);
        data = {
            limit: memory.jsHeapSizeLimit,
            available: memory.totalJSHeapSize,
            consumed: memory.usedJSHeapSize,
        };
        encode(Event.Memory);
    }
}
