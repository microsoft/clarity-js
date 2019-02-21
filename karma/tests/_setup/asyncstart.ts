import { restartClarity } from "@karma/setup/clarity";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { setRealTimeout } from "@karma/setup/proxyapis/jasmineclock";
import { testAsync } from "@karma/setup/testasync";
import { getFullImpressionWatchResult, stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

xdescribe("Setup: Asynchronous clarity start tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that intial activity events have been generated and sent on async start", (done: DoneFn) => {
        const fullImpressionWatch = getFullImpressionWatchResult();
        assert.isAbove(fullImpressionWatch.coreEvents.length, 0);
        assert.isAbove(fullImpressionWatch.sentEvents.length, 0);
        assert.equal(fullImpressionWatch.coreEvents.length, fullImpressionWatch.sentEvents.length);
        done();
    });

    it("checks that 'setupPage' flushes initial Clarity synchronous activity", (done: DoneFn) => {
        watch();
        jasmine.clock().tick(10000000);
        const events = stopWatching().coreEvents;
        assert.equal(events.length, 0);
        done();
    });

    it("checks that 'setupPage' flushes initial Clarity asynchronous activity", (done: DoneFn) => {
        watch();
        setRealTimeout(() => {
            const events = stopWatching().coreEvents;
            assert.equal(events.length, 0);
            done();
        }, 1);
    });

    it("checks that 'setupPage' flushes all initial Clarity activity but nothing's sent in background mode",
        testAsync(async (done: DoneFn) => {
            await restartClarity({ backgroundMode: true });
            setRealTimeout(() => {
                const allEvents = getFullImpressionWatchResult();
                assert.equal(allEvents.coreEvents.length, allEvents.compressedEvents.length);
                assert.equal(allEvents.sentEvents.length, 0);
                done();
            }, 1);
        })
    );

});
