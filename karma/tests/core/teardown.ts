import { assert } from "chai";
import { restartClarity, triggerMutationEventAndWaitForUpload } from "../../setup/clarity";
import { cleanupPage, setupPage } from "../../setup/page";
import { testAsync } from "../../setup/testasync";
import { getFullImpressionWatchResult, stopWatching, watch } from "../../setup/watch";

describe("Teardown Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

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
