import { restartClarity } from "@karma/setup/clarity";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";
import { Action, Source } from "../../../types/layout";

describe("Layout: Input Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that input change capturing works on inserted element", testAsync(async (done: DoneFn) => {
        await restartClarity({ showText: true });

        let newValueString = "new value";
        let input = document.createElement("input");
        document.body.appendChild(input);
        await waitFor(PubSubEvents.MUTATION);

        watch();
        input.value = newValueString;

        // Programmatic value change doesn't trigger "onchange" event, so we need to trigger it manually
        let onChangeEvent = document.createEvent("HTMLEvents");
        onChangeEvent.initEvent("change", false, true);
        input.dispatchEvent(onChangeEvent);
        await waitFor(PubSubEvents.CHANGE);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Update);
        assert.equal(events[0].state.source, Source.Input);
        assert.equal(events[0].state.attributes.value, newValueString);
        done();
    }));

    it("checks that input change capturing works on inserted textarea element", testAsync(async (done: DoneFn) => {
        await restartClarity({ showText: true });

        let newValueString = "new value";
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
        assert.equal(events[0].state.attributes.value, newValueString);
        done();
    }));

});
