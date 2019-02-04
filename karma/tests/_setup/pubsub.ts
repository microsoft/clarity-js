import { assert } from "chai";
import { cleanupPage, setupPage } from "../../setup/page";
import { PubSubEvents, waitFor } from "../../setup/pubsub";
import { testAsync } from "../../setup/testasync";
import { stopWatching, watch } from "../../setup/watch";

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
