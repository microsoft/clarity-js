import { assert } from "chai";
import { stopClarity, triggerClarityAndWaitForUpload } from "../../setup/clarity";
import { cleanupPage, setupPage } from "../../setup/page";
import { testAsync } from "../../setup/testasync";
import { getFullImpressionWatchResult, stopWatching, watch } from "../../setup/watch";

describe("Core: Trigger Tests", () => {

    beforeEach((done: DoneFn) => setupPage(done, { backgroundMode: true }));
    afterEach(cleanupPage);

    it("validates that nothing is sent on teardown in background mode without trigger", (done: DoneFn) => {
        stopClarity();
        const allSentEvents = getFullImpressionWatchResult().sentEvents;
        assert.equal(allSentEvents.length, 0);
        done();
    });

    it("validates that upload queue is flushed when Clarity trigger is fired", testAsync(async (done: DoneFn) => {
        let allSentEvents = getFullImpressionWatchResult().sentEvents;
        assert.equal(allSentEvents.length, 0);
        await triggerClarityAndWaitForUpload();
        allSentEvents = getFullImpressionWatchResult().sentEvents;
        assert.isAbove(allSentEvents.length, 0);
        done();
    }));

});
