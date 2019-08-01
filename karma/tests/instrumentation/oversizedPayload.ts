import { Instrumentation } from "@clarity-types/instrumentation";
import { Action, Source } from "@clarity-types/layout";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { mask } from "@src/utils";
import { assert } from "chai";

const instrumentationEventName = "Instrumentation";

describe("Instrumentation: Oversized Payload Tests", () => {

    beforeEach((done: DoneFn) => {
        setupPage(done, ({ eventLimit: 350 }));
    });
    afterEach(cleanupPage);

    it("validates that oversized instrumentation is logged when large event is attempted", testAsync(async (done: DoneFn) => {
        let newValueString = "this string value makes a state greater than three hundred and fifty bytes";
        let textarea = document.createElement("textarea");
        document.body.appendChild(textarea);
        await waitFor(PubSubEvents.MUTATION);

        watch();
        textarea.value = newValueString;

        // Programmatic value change doesn't trigger "onchange" event, so we need to trigger it manually
        let onInputEvent = document.createEvent("HTMLEvents");
        onInputEvent.initEvent("input", false, true);
        textarea.dispatchEvent(onInputEvent);
        await waitFor(PubSubEvents.INPUT);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].type, instrumentationEventName);
        assert.equal(events[0].state.type, Instrumentation.OversizedEvent);
        assert.equal(events[0].state.cutInfo.type, "Layout");
        assert.equal(events[0].state.cutInfo.action, Action.Update);
        assert.equal(events[0].state.cutInfo.event, null);
        // giving some wiggle room to the size component as the size of the state that was deemed oversized
        // is slightly variable based on ids of the event and its parents/siblings
        assert.isAtLeast(events[0].state.cutInfo.stateLength, 365);
        assert.isAtMost(events[0].state.cutInfo.stateLength, 385);
        done();
    }));

    it("validates that oversized instrumentation is not logged when acceptable event is attempted", testAsync(async (done: DoneFn) => {
        let newValueString = "this string makes a state smaller than 350 bytes";
        let textarea = document.createElement("textarea");
        document.body.appendChild(textarea);
        await waitFor(PubSubEvents.MUTATION);

        watch();
        textarea.value = newValueString;

        // Programmatic value change doesn't trigger "onchange" event, so we need to trigger it manually
        let onInputEvent = document.createEvent("HTMLEvents");
        onInputEvent.initEvent("input", false, true);
        textarea.dispatchEvent(onInputEvent);
        await waitFor(PubSubEvents.INPUT);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Update);
        assert.equal(events[0].state.source, Source.Input);
        assert.equal(events[0].state.value, mask(newValueString));
        done();
    }));
});
