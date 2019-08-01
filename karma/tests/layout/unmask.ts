import { Action } from "@clarity-types/layout";
import { UnmaskAttribute } from "@clarity-types/layout";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

describe("Layout: Unmasking Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that child value is unmasked when parent unmask attribute is applied",
        testAsync(async (done: DoneFn) => {
            watch();
            let valueString = "value";
            let input = document.createElement("input");
            let child = document.createTextNode(valueString);
            input.setAttribute(UnmaskAttribute, "true");
            input.appendChild(child);
            document.body.appendChild(input);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 2);
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.tag, input.tagName);
            assert.equal(events[1].state.action, Action.Insert);
            assert.equal(events[1].state.tag, "*TXT*");
            assert.equal(events[1].state.content, valueString);
            done();
        })
    );

    it(`checks that node value is unmasked when skip-parent unmask attribute is applied`,
        testAsync(async (done: DoneFn) => {
            watch();
            let valueString = "value";
            let skipParent = document.createElement("div");
            let parent = document.createElement("div");
            let child = document.createTextNode(valueString);
            parent.appendChild(child);
            skipParent.appendChild(parent);
            skipParent.setAttribute(UnmaskAttribute, "true");
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
            assert.equal(events[2].state.content, valueString);
            done();
        })
    );

    it("checks that input value is unmasked on insert if unmask attribute is applied",
        testAsync(async (done: DoneFn) => {
            watch();
            let input = document.createElement("input");
            let valueString = "value";
            input.setAttribute("value", valueString);
            input.setAttribute(UnmaskAttribute, "true");
            document.body.appendChild(input);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 1);
            assert.equal(events[0].state.tag, "INPUT");
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.value, valueString);
            done();
        })
    );

});
