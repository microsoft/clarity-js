import { assert } from "chai";
import { Instrumentation } from "../../../types/instrumentation";
import { restartClarity, triggerClarity } from "../../setup/clarity";
import { cleanupPage, setupPage } from "../../setup/page";
import { testAsync } from "../../setup/testasync";
import { stopWatching, watch } from "../../setup/watch";

const instrumentationEventName = "Instrumentation";

describe("Instrumentation: Trigger Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("validates that trigger instrumentation is logged when Clarity trigger is fired", testAsync(async (done: DoneFn) => {
        const triggerKey = "Test Trigger";
        await restartClarity({ instrument: true, backgroundMode: true });

        watch();
        triggerClarity(triggerKey);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].type, instrumentationEventName);
        assert.equal(events[0].state.type, Instrumentation.Trigger);
        assert.equal(events[0].state.key, triggerKey);
        done();
    }));
});
