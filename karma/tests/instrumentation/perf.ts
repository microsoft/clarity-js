import { IEvent } from "@clarity-types/core";
import { Instrumentation } from "@clarity-types/instrumentation";
import { restartClarity } from "@karma/setup/clarity";
import { cleanupPage, setupPageAndStartClarity } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { getFullImpressionWatchResult, stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

const instrumentationEventName = "Instrumentation";

describe("Instrumentation: Performance Tests", () => {

    beforeEach(setupPageAndStartClarity);
    afterEach(cleanupPage);

    it("validates that discover performance instrumentation is logged", testAsync(async (done: DoneFn) => {
        await restartClarity({ instrument: true });

        const sentEvents = getFullImpressionWatchResult().sentEvents;
        let discoverPerfEvent: IEvent = null;
        for (let i = 0; i < sentEvents.length; i++) {
            const event: IEvent = sentEvents[i];
            if (
                event.type === instrumentationEventName
                && event.state.type === Instrumentation.Performance
                && event.state.procedure === "Discover"
            ) {
                discoverPerfEvent = event;
            }
        }

        assert.notEqual(discoverPerfEvent, null);
        assert.isNumber(discoverPerfEvent.state.duration);
        assert.isAbove(discoverPerfEvent.state.nodeCount, 0);
        done();
    }));

    it("validates that mutation performance instrumentation is logged", testAsync(async (done: DoneFn) => {
        await restartClarity({ instrument: true });

        watch();
        let div = document.createElement("div");
        document.body.appendChild(div);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 2);
        assert.equal(events[0].type, "Layout");
        assert.equal(events[1].type, instrumentationEventName);
        assert.equal(events[1].state.type, Instrumentation.Performance);
        assert.equal(events[1].state.procedure, "Mutation");
        assert.equal(events[1].state.mutationCount, 1);
        assert.equal(events[1].state.mutationSequence, 0);
        assert.isNumber(events[1].state.stateGenDuration);
        assert.equal(events[1].state.summaryCounts.inserts, 1);
        assert.equal(events[1].state.summaryCounts.moves, 0);
        assert.equal(events[1].state.summaryCounts.updates, 0);
        assert.equal(events[1].state.summaryCounts.removes, 0);

        done();
    }));
});
