type Mutable<T> = {
    -readonly[P in keyof T]: T[P]
};

type IMockPerformanceTiming = Partial<Mutable<PerformanceTiming>>;
type IMockPerformanceEntry = Partial<Mutable<PerformanceEntry>>;
type IMockPerformanceResourceTiming = Partial<Mutable<PerformanceResourceTiming>>;

export interface IMockPerformance {
    timing: IMockPerformanceTiming;
    addEntry(entry: IMockPerformanceEntry): void;
    getEntriesByType(type: string): IMockPerformanceEntry[];
    clearResourceTimings(): void;
}

export function createMockPerformanceObject(): IMockPerformance {
    let entries: IMockPerformanceEntry[] = [];
    return {
        timing: createMockPerformanceTiming(),
        addEntry(entry: IMockPerformanceEntry): void {
            entries.push(entry);
        },
        getEntriesByType(type: string): IMockPerformanceEntry[] {
            return entries.filter((entry: IMockPerformanceEntry): boolean => entry.entryType === type);
        },
        clearResourceTimings() {
            entries = entries.filter((entry: IMockPerformanceEntry): boolean => entry.entryType !== "resource");
        }
    };
}

export function createMockPerformanceTiming(): IMockPerformanceTiming {
    return {
        connectEnd: 1548794791246,
        connectStart: 1548794791216,
        domComplete: 1548794793320,
        domContentLoadedEventEnd: 1548794792866,
        domContentLoadedEventStart: 1548794792596,
        domInteractive: 1548794792596,
        domLoading: 1548794791381,
        domainLookupEnd: 1548794791216,
        domainLookupStart: 1548794791207,
        fetchStart: 1548794791203,
        loadEventEnd: 1548794793323,
        loadEventStart: 1548794793320,
        navigationStart: 1548794791202,
        redirectEnd: 0,
        redirectStart: 0,
        requestStart: 1548794791246,
        responseEnd: 1548794792046,
        responseStart: 1548794791354,
        secureConnectionStart: 1548794791225,
        unloadEventEnd: 1548794791364,
        unloadEventStart: 1548794791363
    };
}

export function createMockPerformanceResourceTimings(): IMockPerformanceResourceTiming[] {
    return [
        {
            connectEnd: 276.8000001087785,
            connectStart: 276.8000001087785,
            decodedBodySize: 52853,
            domainLookupEnd: 276.8000001087785,
            domainLookupStart: 276.8000001087785,
            duration: 335.1000000257045,
            encodedBodySize: 12851,
            entryType: "resource",
            fetchStart: 276.8000001087785,
            initiatorType: "script",
            name: "https://mockperformance.test/resource/1",
            nextHopProtocol: "h2",
            redirectEnd: 0,
            redirectStart: 0,
            requestStart: 506.2000001780689,
            responseEnd: 611.900000134483,
            responseStart: 510.5000000912696,
            secureConnectionStart: 0,
            startTime: 276.8000001087785,
            transferSize: 12948,
            workerStart: 0
        },
        {
            connectEnd: 287.40000003017485,
            connectStart: 287.40000003017485,
            decodedBodySize: 701397,
            domainLookupEnd: 287.40000003017485,
            domainLookupStart: 287.40000003017485,
            duration: 553.7000000476837,
            encodedBodySize: 158455,
            entryType: "resource",
            fetchStart: 287.40000003017485,
            initiatorType: "script",
            name: "https://mockperformance.test/resource/2",
            nextHopProtocol: "h2",
            redirectEnd: 0,
            redirectStart: 0,
            requestStart: 609.6000000834465,
            responseEnd: 841.1000000778586,
            responseStart: 647.1000001765788,
            secureConnectionStart: 0,
            startTime: 287.40000003017485,
            transferSize: 158658,
            workerStart: 0
        },
        {
            connectEnd: 2888.3000002242625,
            connectStart: 2888.3000002242625,
            decodedBodySize: 499,
            domainLookupEnd: 2888.3000002242625,
            domainLookupStart: 2888.3000002242625,
            duration: 395.5999999307096,
            encodedBodySize: 499,
            entryType: "resource",
            fetchStart: 2888.3000002242625,
            initiatorType: "img",
            name: "https://mockperformance.test/resource/3",
            nextHopProtocol: "h2",
            redirectEnd: 0,
            redirectStart: 0,
            requestStart: 2898.100000107661,
            responseEnd: 3283.900000154972,
            responseStart: 3282.0000001229346,
            secureConnectionStart: 0,
            startTime: 2888.3000002242625,
            transferSize: 812,
            workerStart: 0
        }
    ];
}
