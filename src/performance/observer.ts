import { LargestContentfulPaintEntry, LongTaskEntry } from "@clarity-types/performance";
import measure from "@src/core/measure";
import * as contentful from "@src/performance/contentfulPaint";
import * as longtask from "@src/performance/longtask";
import * as navigation from "@src/performance/navigation";
import * as network from "@src/performance/network";
import * as paint from "@src/performance/paint";

let observer: PerformanceObserver;

export function start(): void {
    if (window["PerformanceObserver"]) {
        handle(performance);
        if (observer) { observer.disconnect(); }
        observer = new PerformanceObserver(measure(handle) as PerformanceObserverCallback);
        observer.observe({entryTypes: ["navigation", "resource", "longtask", "paint", "largest-contentful-paint"]});
    }
}

function handle(entries: PerformanceObserverEntryList): void {
    for (let entry of entries.getEntries()) {
        switch (entry.entryType) {
            case "navigation":
                navigation.compute(entry as PerformanceNavigationTiming);
                break;
            case "resource":
                network.compute(entry as PerformanceResourceTiming);
                break;
            case "paint":
                paint.compute(entry);
                break;
            case "longtask":
                longtask.compute(entry as LongTaskEntry);
                break;
            case "largest-contentful-paint":
                contentful.compute(entry as LargestContentfulPaintEntry);
                break;
        }
    }
}

export function end(): void {
    if (observer) { observer.disconnect(); }
    observer = null;
}
