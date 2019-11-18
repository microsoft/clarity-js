
import { BooleanFlag, Target } from "./data";

/* Helper Interface */

// Reference: https://wicg.github.io/largest-contentful-paint/
export interface LargestContentfulPaint extends PerformanceEntry {
    renderTime: DOMHighResTimeStamp;
    loadTime: DOMHighResTimeStamp;
    size: number;
    id: string;
    url: string;
    element?: Element;
}

// Reference: https://wicg.github.io/netinfo/#networkinformation-interface
export interface NavigatorConnection extends EventTarget {
    effectiveType: string;
    downlinkMax: number;
    downlink: number;
    rtt: number;
    saveData: boolean;
}

// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
export interface PerformanceMemory {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
}

export interface LongTaskState {
    time: number;
    data: LongTaskData;
}

export interface PaintState {
    time: number;
    data: PaintData;
}

export interface NetworkState {
    url: string;
    data: NetworkData;
}

/* Event Data */
export interface LongTaskData {
    duration: number;
}

export interface PaintData {
    name: string;
}

export interface NetworkData {
    start: number;
    duration: number;
    size: number;
    target: Target;
    initiator: string;
    protocol: string;
    host: string;
}

export interface LargestContentfulData {
    load: number;
    render: number;
    size: number;
    target: Target;
}

export interface NavigationData {
    fetchStart: number;
    connectStart: number;
    connectEnd: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
    domInteractive: number;
    domComplete: number;
    loadEventEnd: number;
    size: number;
    type: string;
    protocol: string;
}

export interface MemoryData {
    limit: number;
    available: number;
    consumed: number;
}

export interface ConnectionData {
    downlink: number;
    rtt: number;
    saveData: BooleanFlag;
    type: string;
}
