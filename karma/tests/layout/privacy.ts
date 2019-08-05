import { Action, Source } from "@clarity-types/layout";
import { restartClarity } from "@karma/setup/clarity";
import { cleanupPage, setupPageAndStartClarity } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { MaskAttribute, UnmaskAttribute } from "@src/plugins/layout/nodeinfo";
import { mask } from "@src/utils";
import { assert } from "chai";

describe("Layout: Privacy Tests", () => {

    beforeEach(setupPageAndStartClarity);
    afterEach(cleanupPage);

    it("checks that default sensitive attributes are masked", testAsync(async (done: DoneFn) => {
        const sensitiveAttributeName = "placeholder";
        watch();
        let value = "value";
        let maskedValue = mask(value);
        let div = document.createElement("div");
        div.setAttribute(sensitiveAttributeName, value);
        document.body.appendChild(div);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, div.tagName);
        assert.equal(events[0].state.attributes[sensitiveAttributeName], maskedValue);
        done();
    }));

    it("checks that configurable sensitive attributes are masked", testAsync(async (done: DoneFn) => {
        const sensitiveAttributeName = "data-sensitive-attribute";
        await restartClarity({ sensitiveAttributes: [sensitiveAttributeName] });

        watch();
        let value = "value";
        let maskedValue = mask(value);
        let div = document.createElement("div");
        div.setAttribute(sensitiveAttributeName, value);
        document.body.appendChild(div);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.tag, div.tagName);
        assert.equal(events[0].state.attributes[sensitiveAttributeName], maskedValue);
        done();
    }));

    it("checks that input value is masked on insert", testAsync(async (done: DoneFn) => {
        watch();
        let input = document.createElement("input");
        let valueString = "value";
        let maskedValueString = mask(valueString);
        input.setAttribute("value", valueString);
        document.body.appendChild(input);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.tag, "INPUT");
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.value, maskedValueString);
        done();
    }));

    it("checks that input value is masked on input update", testAsync(async (done: DoneFn) => {
        let newValueString = "new value";
        let maskedValueString = mask(newValueString);
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
        assert.equal(events[0].state.value, maskedValueString);
        done();
    }));

    it("checks that node value is masked event when explicitly masked if unmask attribute is applied to parent",
        testAsync(async (done: DoneFn) => {
            watch();
            let valueString = "value";
            let maskedValueString = mask(valueString);
            let skipParent = document.createElement("div");
            let parent = document.createElement("div");
            let child = document.createTextNode(valueString);
            parent.appendChild(child);
            skipParent.appendChild(parent);
            skipParent.setAttribute(UnmaskAttribute, "true");
            parent.setAttribute(MaskAttribute, "true");
            document.body.appendChild(skipParent);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 3);
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.tag, skipParent.tagName);
            assert.equal(events[1].state.action, Action.Insert);
            assert.equal(events[1].state.tag, parent.tagName);
            assert.equal(events[2].state.action, Action.Insert);
            assert.equal(events[2].state.tag, "*TXT*");
            assert.equal(events[2].state.content, maskedValueString);
            done();
        })
    );

});
