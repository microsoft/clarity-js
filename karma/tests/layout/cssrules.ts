import { cleanupPage, setupPage } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";
import { Action } from "../../../types/layout";

describe("Layout: CSS Rules Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that we capture cssRule modifications via javascript when no innerText found", testAsync(async (done: DoneFn) => {
        watch();

        // Add a style tag and later modify styles using javascript
        let dom = document.getElementById("clarity");
        let style = document.createElement("style");
        dom.appendChild(style);
        let stylesheet = style.sheet as CSSStyleSheet;
        stylesheet.insertRule("body { color: red; }");
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;

        // Assert that style state has css rules and that style's child text node is ignored
        assert.equal(events.length, 1);
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(!!events[0].state.cssRules, true);
        assert.equal(events[0].state.cssRules.length, 1);
        assert.equal(events[0].state.cssRules[0].indexOf("red") > 0, true);
        done();
    }));

});
