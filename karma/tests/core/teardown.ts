import { restartClarity, stopClarity, triggerMutationEventAndWaitForUpload } from "@karma/setup/clarity";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

describe("Core: Teardown Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("validates that pending events are sent on teardown", (done: DoneFn) => {
        // Start clarity synchronously, so that initial events are "stuck" in compression workers when we call stopClarity()
        restartClarity({}, { flushInitialActivity: false }, watch);
        stopClarity();
        const sentEvents = stopWatching().sentEvents;
        assert.isAbove(sentEvents.length, 0);
        done();
    });

    it("validates that config is reset to default on teardown", testAsync(async (done: DoneFn) => {
        const mockSensitiveAttr: string = "mock-sensitive-attribute";

        watch();
        const triggerAttributes = {};
        triggerAttributes[mockSensitiveAttr] = "1";
        await triggerMutationEventAndWaitForUpload(triggerAttributes);

        let events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.attributes[mockSensitiveAttr], "1");

        // Sensitive attributes are masked
        await restartClarity({ sensitiveAttributes: [mockSensitiveAttr] });
        await restartClarity();

        watch();
        await triggerMutationEventAndWaitForUpload(triggerAttributes);

        events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.attributes[mockSensitiveAttr], "1");
        done();
    }));

});
