import * as PubSub from "pubsub-js";

import { getActiveConfig, getVersion, triggerMutationEvent } from "@karma/setup/clarity";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { PubSubEvents, waitFor, yieldThread } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { assert } from "chai";

describe("Core Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("validates that core.ts version matches package.json", (done: DoneFn) => {
        let testJsons = window["__test_jsons"];
        let packageJson = testJsons && testJsons["package"];
        assert.equal(packageJson.version, getVersion());
        done();
    });

    it("validates that force compression message is sent after config.delay milliseconds without new events",
        testAsync(async (done: DoneFn) => {
            triggerMutationEvent();
            await waitFor(PubSubEvents.MUTATION);
            PubSub.subscribe(PubSubEvents.WORKER_FORCE_COMPRESSION_MESSAGE, done);
            jasmine.clock().tick(getActiveConfig().delay);
        })
    );

    it("validates that force compression message is NOT sent after less than config.delay milliseconds without new events",
        testAsync(async (done: DoneFn) => {
            triggerMutationEvent();
            await waitFor(PubSubEvents.MUTATION);
            jasmine.clock().tick(getActiveConfig().delay - 1);
            PubSub.subscribe(PubSubEvents.WORKER_FORCE_COMPRESSION_MESSAGE, () => { done.fail("Received force compression message"); });
            await yieldThread();
            done();
        })
    );

    it("validates that force compression timeout is reset with each new event", testAsync(async (done: DoneFn) => {
        PubSub.subscribe(PubSubEvents.WORKER_FORCE_COMPRESSION_MESSAGE, () => { done.fail("Received force compression message"); });

        triggerMutationEvent();
        await waitFor(PubSubEvents.MUTATION);
        jasmine.clock().tick(getActiveConfig().delay - 1);

        // If force compression timeout wasn't reset between two events, second config.delay - 1 tick
        // would trigger force compression and fail the test
        triggerMutationEvent();
        await waitFor(PubSubEvents.MUTATION);
        jasmine.clock().tick(getActiveConfig().delay - 1);

        await yieldThread();
        done();
    }));

});
