import { Instrumentation } from "@clarity-types/instrumentation";
import { restartClarity } from "@karma/setup/clarity";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { testAsync } from "@karma/setup/testasync";
import { getFullImpressionWatchResult } from "@karma/setup/watch";
import { ClarityAttribute } from "@src/core";
import { assert } from "chai";

const instrumentationEventName = "Instrumentation";

xdescribe("Instrumentation: Activate Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("validates that missing feature event is sent when required feature is missing", testAsync(async (done: DoneFn) => {

        // Function.prototype.bind is a required API for Clarity to work
        // Mocking a browser that doesn't support it by temporarily deleting it
        const _bind = Function.prototype.bind;
        Function.prototype.bind = undefined;
        await restartClarity({ instrument: true });
        Function.prototype.bind = _bind;

        const events = getFullImpressionWatchResult().sentEvents;
        assert.equal(events.length, 2);
        assert.equal(events[0].type, instrumentationEventName);
        assert.equal(events[0].state.type, Instrumentation.MissingFeature);
        assert.equal(events[1].type, instrumentationEventName);
        assert.equal(events[1].state.type, Instrumentation.Teardown);
        done();
    }));

    it("validates that error during clarity activate is caught and logged correctly", testAsync(async (done: DoneFn) => {
        const _worker = Worker;
        const mockErrorText = "Mock error!";
        Worker = ((): void => { throw new Error(mockErrorText); }) as any;
        await restartClarity({ instrument: true });
        Worker = _worker;

        const events = getFullImpressionWatchResult().sentEvents;
        assert.equal(events.length, 2);
        assert.equal(events[0].type, instrumentationEventName);
        assert.equal(events[0].state.type, Instrumentation.ClarityActivateError);
        assert.equal(events[0].state.error, mockErrorText);
        assert.equal(events[1].type, instrumentationEventName);
        assert.equal(events[1].state.type, Instrumentation.Teardown);
        done();
    }));

    it("validates that Clarity logs instrumentation and tears down, when another instance of Clarity is running",
        testAsync(async (done: DoneFn) => {
            const mockExistingImpressionId = "MockExistingImpressionId";
            await restartClarity({ instrument: true }, null, () => {
                document[ClarityAttribute] = mockExistingImpressionId;
            });

            const events = getFullImpressionWatchResult().sentEvents;
            assert.equal(events.length, 2);
            assert.equal(events[0].type, instrumentationEventName);
            assert.equal(events[0].state.type, Instrumentation.ClarityDuplicated);
            assert.equal(events[0].state.currentImpressionId, mockExistingImpressionId);
            assert.equal(events[1].type, instrumentationEventName);
            assert.equal(events[1].state.type, Instrumentation.Teardown);
            done();
        })
    );

});
