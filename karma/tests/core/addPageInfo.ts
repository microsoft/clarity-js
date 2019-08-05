import { restartClarity, startClarity, triggerClarityCustomEvent, triggerSetPageInfo } from "@karma/setup/clarity";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

describe("Add Page Info Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    const pageId = "PageId";
    const userId = "UserId";
    const testPropValue = "Value";

    it("validates that impressionId and userId can be set by user",
        testAsync(async (done: DoneFn) => {
            watch();
            triggerSetPageInfo(pageId, userId);
            await startClarity();
            triggerClarityCustomEvent({ testProp:  testPropValue });
            await restartClarity();

            let envelopes = stopWatching().sentEnvelopes;
            assert.equal(envelopes[0].clarityId, userId);
            assert.equal(envelopes[0].impressionId, pageId);
            done();
        })
    );

    it("validates that just impressionId can be set by user",
        testAsync(async (done: DoneFn) => {
            watch();
            triggerSetPageInfo(pageId, null);
            await startClarity();
            triggerClarityCustomEvent({ testProp:  testPropValue });
            await restartClarity();

            let envelopes = stopWatching().sentEnvelopes;
            assert.equal(envelopes[0].impressionId, pageId);
            done();
        })
    );

    it("validates that just user can be set by user",
        testAsync(async (done: DoneFn) => {
            watch();
            triggerSetPageInfo(null, userId);
            await startClarity();
            triggerClarityCustomEvent({ testProp:  testPropValue });
            await restartClarity();

            let envelopes = stopWatching().sentEnvelopes;
            assert.equal(envelopes[0].clarityId, userId);
            done();
        })
    );

    it("validates that setPageInfo is noop if Clarity has already started",
        testAsync(async (done: DoneFn) => {
            const differentPageId = "differentPageId";
            const differentUserId = "differentUserId";
            watch();
            await startClarity();
            triggerSetPageInfo(differentPageId, differentUserId);
            triggerClarityCustomEvent({ testProp:  testPropValue });
            await restartClarity();

            let envelopes = stopWatching().sentEnvelopes;
            assert.notEqual(envelopes[0].clarityId, differentUserId);
            assert.notEqual(envelopes[0].impressionId, differentPageId);
            done();
        })
    );

});
