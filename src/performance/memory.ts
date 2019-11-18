import { Event } from "@clarity-types/data";
import { MemoryData, PerformanceMemory } from "@clarity-types/performance";
import encode from "./encode";

export let data: MemoryData = null;

export function reset(): void {
    data = null;
}

export function compute(): void {
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
