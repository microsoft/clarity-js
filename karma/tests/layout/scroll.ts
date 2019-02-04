import { assert } from "chai";
import { Action, Source } from "../../../types/layout";
import { cleanupPage, setupPage } from "../../setup/page";
import { PubSubEvents, waitFor } from "../../setup/pubsub";
import { testAsync } from "../../setup/testasync";
import { stopWatching, watch } from "../../setup/watch";

describe("Layout: Scroll Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that scroll capturing works on inserted element", testAsync(async (done: DoneFn) => {

        // Add a scrollable DIV
        let outerDiv = document.createElement("div");
        let innerDiv = document.createElement("div");
        outerDiv.style.overflowY = "auto";
        outerDiv.style.width = "200px";
        outerDiv.style.maxHeight = "100px";
        innerDiv.style.height = "300px";
        outerDiv.appendChild(innerDiv);
        document.body.appendChild(outerDiv);
        await waitFor(PubSubEvents.MUTATION);

        watch();

        // Trigger scroll
        outerDiv.scrollTop = 100;
        await waitFor(PubSubEvents.SCROLL);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Update);
        assert.equal(events[0].state.source, Source.Scroll);
        done();
    }));

    it("checks that scroll capturing works on overflow hidden element after a mutation update", testAsync(async (done: DoneFn) => {

        // Add a scrollable DIV
        let outerDiv = document.createElement("div");
        let innerDiv = document.createElement("div");
        outerDiv.style.overflowY = "hidden";
        outerDiv.style.width = "200px";
        outerDiv.style.maxHeight = "100px";
        innerDiv.style.height = "300px";
        outerDiv.appendChild(innerDiv);
        document.body.appendChild(outerDiv);
        await waitFor(PubSubEvents.MUTATION);

        // Force a mutation to ensure that layout updates also capture scroll position
        outerDiv.setAttribute("data-attribute", "1");
        await waitFor(PubSubEvents.MUTATION);

        watch();

        // Trigger scroll after a mutation update
        outerDiv.scrollTop = 100;
        await waitFor(PubSubEvents.SCROLL);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Update);
        assert.equal(events[0].state.source, Source.Scroll);
        done();
    }));

    it("checks that scroll capturing works on element that enables scrolling after a mutation update", testAsync(async (done: DoneFn) => {

        // Add a scrollable DIV
        let outerDiv = document.createElement("div");
        let innerDiv = document.createElement("div");
        let mutationCount = 0;
        outerDiv.style.overflowY = "visible";
        outerDiv.style.width = "200px";
        innerDiv.style.height = "300px";
        outerDiv.appendChild(innerDiv);
        document.body.appendChild(outerDiv);
        await waitFor(PubSubEvents.MUTATION);

        // Make the element scrollable
        outerDiv.style.maxHeight = "100px";
        outerDiv.style.overflowY = "hidden";

        // Force a mutation to ensure that layout updates also capture scroll position
        outerDiv.setAttribute("data-attribute", "1");
        await waitFor(PubSubEvents.MUTATION);

        watch();

        // Trigger scroll after a mutation update
        outerDiv.scrollTop = 100;
        await waitFor(PubSubEvents.SCROLL);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Update);
        assert.equal(events[0].state.source, Source.Scroll);
        done();
    }));

});
