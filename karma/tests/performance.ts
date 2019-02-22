import { IPerformanceResourceTimingState, IPerformanceTiming } from "@clarity-types/performance";
import { restartClarity } from "@karma/setup/clarity";
import { createMockPerformanceResourceTimings, IMockPerformance } from "@karma/setup/mocks/performance";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { testAsync } from "@karma/setup/testasync";
import { filterEventsByType, getFullImpressionWatchResult, stopWatching, watch } from "@karma/setup/watch";
import { ResourceTimingEventType } from "@src/plugins/performance";
import { assert } from "chai";

let resourceTimingEventName = "ResourceTiming";
let stateErrorEventName = "PerformanceStateError";
let navigationTimingEventName = "NavigationTiming";

declare const performance: IMockPerformance;

describe("Performance Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that w3c performance timing is logged by clarity", (done: DoneFn) => {
        const sentEvents = getFullImpressionWatchResult().sentEvents;
        const navTimingEvents = filterEventsByType(sentEvents, navigationTimingEventName);
        assert.equal(navTimingEvents.length, 1);

        const eventTiming: IPerformanceTiming = navTimingEvents[0].state.timing;
        assert.equal(eventTiming.connectStart, formatTiming(performance.timing.connectStart));
        assert.equal(eventTiming.connectEnd, formatTiming(performance.timing.connectEnd));
        done();
    });

    it("checks that network resource timings are logged by clarity", (done: DoneFn) => {
        watch();
        const resourceTiming = createMockPerformanceResourceTimings()[0];
        performance.addEntry(resourceTiming);
        triggerNextPerformancePoll();

        const events = filterEventsByType(stopWatching().coreEvents, resourceTimingEventName);
        assert.equal(events.length, 1);
        assert.equal(events[0].type, ResourceTimingEventType);

        // Check sample string value and sample numeric value
        const eventState: IPerformanceResourceTimingState = events[0].state;
        assert.equal(eventState.name, resourceTiming.name);
        assert.equal(eventState.connectStart, Math.round(resourceTiming.connectStart));
        done();
    });

    it("checks that error is logged when entries are cleared", (done: DoneFn) => {
        watch();
        const resourceTiming = createMockPerformanceResourceTimings()[0];
        performance.addEntry(resourceTiming);
        triggerNextPerformancePoll();

        let events = filterEventsByType(stopWatching().coreEvents, resourceTimingEventName);
        assert.equal(events.length, 1);

        watch();
        performance.clearResourceTimings();
        triggerNextPerformancePoll();

        events = filterEventsByType(stopWatching().coreEvents, stateErrorEventName);
        assert.equal(events.length, 1);
        done();
    });

    // "Incomplete" entries are entries for resources that are not finished loading yet
    it("checks that incomplete entries are not logged initially, but then revisited", (done: DoneFn) => {
        let resourceTimings = createMockPerformanceResourceTimings();
        const completeEntry = resourceTimings[0];
        const incompleteEntry = resourceTimings[1];
        const _responseEnd = incompleteEntry.responseEnd;
        incompleteEntry.responseEnd = 0;

        watch();
        performance.addEntry(completeEntry);
        performance.addEntry(incompleteEntry);
        triggerNextPerformancePoll();

        let events = filterEventsByType(stopWatching().coreEvents, resourceTimingEventName);
        assert.equal(events.length, 1);
        assert.equal(events[0].type, ResourceTimingEventType);
        assert.equal(events[0].state.name, completeEntry.name);

        // Adjust the entry to have a valid response end time and wait for snapshot to propagate
        watch();
        incompleteEntry.responseEnd = _responseEnd;
        triggerNextPerformancePoll();

        events = filterEventsByType(stopWatching().coreEvents, resourceTimingEventName);
        assert.equal(events.length, 1);
        assert.equal(events[0].type, ResourceTimingEventType);
        assert.equal(events[0].state.name, incompleteEntry.name);
        assert.equal(events[0].state.responseEnd, Math.round(_responseEnd));
        done();
    });

    it("checks that network resource timings blacklisted in config are ignored", testAsync(async (done: DoneFn) => {
        const blacklistedUrl = "https://www.blacklisted.url";
        const resourceTiming = createMockPerformanceResourceTimings()[0];
        await restartClarity({ urlBlacklist: [blacklistedUrl] });

        watch();
        resourceTiming.name = getFullUrl(blacklistedUrl);
        performance.addEntry(resourceTiming);
        triggerNextPerformancePoll();

        const events = filterEventsByType(stopWatching().coreEvents, resourceTimingEventName);
        assert.equal(events.length, 0);
        done();
    }));

    function formatTiming(value: number): number {
        return value === 0 ? 0 : Math.round(value - performance.timing.navigationStart);
    }

    function getFullUrl(partialUrl: string): string {
        const a = document.createElement("a");
        a.href = partialUrl;
        return a.href;
    }

    function triggerNextPerformancePoll(): void {
        jasmine.clock().tick(100000);
    }
});
