import { cleanupPage, setupPage } from "@karma/setup/page";
import { getFullImpressionWatchResult } from "@karma/setup/watch";
import { assert } from "chai";

xdescribe("Setup: Synchronous clarity start tests", () => {

    beforeEach((done: DoneFn) => setupPage(done, {}, { flushInitialActivity: false }));
    afterEach(cleanupPage);

    it("checks that events have been generated but not sent yet on synchonous start", (done: DoneFn) => {
        const fullImpressionWatch = getFullImpressionWatchResult();
        assert.isAbove(fullImpressionWatch.coreEvents.length, 0);
        assert.equal(fullImpressionWatch.sentEvents.length, 0);
        done();
    });

});
