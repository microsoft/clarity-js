import { cleanupPage, setupPage } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

describe("Setup: PubSub Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that 'waitFor' async function works as intended", testAsync(async (done: DoneFn) => {
        watch();
        document.body.appendChild(document.createElement("div"));
        await waitFor(PubSubEvents.MUTATION);
        const events = stopWatching().coreEvents;
        assert.isAbove(events.length, 0);
        done();
    }));

});
