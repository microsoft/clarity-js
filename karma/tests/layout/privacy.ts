import { assert } from "chai";
import { ForceMaskAttribute } from "../../../src/plugins/layout/nodeinfo";
import { mask } from "../../../src/utils";
import { Action, Source } from "../../../types/layout";
import { restartClarity } from "../../setup/clarity";
import { cleanupPage, setupPage } from "../../setup/page";
import { PubSubEvents, waitFor } from "../../setup/pubsub";
import { testAsync } from "../../setup/testasync";
import { stopWatching, watch } from "../../setup/watch";

describe("Layout: Privacy Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("checks that child value is masked when the config is set to show text and parent mask attribute is applied",
        testAsync(async (done: DoneFn) => {
            await restartClarity({ showImages: true });

            watch();
            let valueString = "value";
            let input = document.createElement("input");
            let child = document.createTextNode(valueString);
            let maskedValueString = mask(valueString);
            input.setAttribute(ForceMaskAttribute, "true");
            input.appendChild(child);
            document.body.appendChild(input);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 2);
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.tag, input.tagName);
            assert.equal(events[1].state.action, Action.Insert);
            assert.equal(events[1].state.tag, "*TXT*");
            assert.equal(events[1].state.content, maskedValueString);
            done();
        })
    );

    it(`checks that child value is masked when the config is set to show text and skip-parent mask attribute is applied`,
        testAsync(async (done: DoneFn) => {
            await restartClarity({ showText: true });

            watch();
            let valueString = "value";
            let skipParent = document.createElement("div");
            let parent = document.createElement("div");
            let child = document.createTextNode(valueString);
            let maskedValueString = mask(valueString);
            parent.appendChild(child);
            skipParent.appendChild(parent);
            skipParent.setAttribute(ForceMaskAttribute, "true");
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

    // BUG: This test fails
    xit("checks that configurable sensitive attributes are masked when config is set to not show text", testAsync(async (done: DoneFn) => {
        const sensitiveAttributeName = "data-sensitive-attribute";
        await restartClarity({ showText: true, sensitiveAttributes: [sensitiveAttributeName] });

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

    it("checks that default sensitive attributes are masked when config is set to not show text", testAsync(async (done: DoneFn) => {
        const sensitiveAttributeName = "placeholder";
        await restartClarity({ showText: false });

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

    it("checks that images source is not captured if the config disallows it", testAsync(async (done: DoneFn) => {
        await restartClarity({ showImages: false });

        watch();
        let img = document.createElement("img");
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
        document.body.appendChild(img);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.tag, "IMG");
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal("src" in events[0].state.attributes, false);
        done();
    }));

    it("checks that images source is not captured if the config allows it but mask attribute is applied",
        testAsync(async (done: DoneFn) => {
            await restartClarity({ showImages: true });

            watch();
            let img = document.createElement("img");
            img.setAttribute(ForceMaskAttribute, "true");
            img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
            document.body.appendChild(img);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 1);
            assert.equal(events[0].state.tag, "IMG");
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal("src" in events[0].state.attributes, false);
            done();
        })
    );

    it("checks that images source is captured if the config allows it", testAsync(async (done: DoneFn) => {
        await restartClarity({ showImages: true });

        watch();
        let img = document.createElement("img");
        let src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAEALAAAAAABAAEAAAIBTAA7";
        img.src = src;
        document.body.appendChild(img);
        await waitFor(PubSubEvents.MUTATION);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.tag, "IMG");
        assert.equal(events[0].state.action, Action.Insert);
        assert.equal(events[0].state.attributes["src"], src);
        done();
    }));

    it("checks that input value is masked on insert if the config is set to not show text", testAsync(async (done: DoneFn) => {
        await restartClarity({ showText: false });

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
        assert.equal(events[0].state.attributes["value"], maskedValueString);
        done();
    }));

    it("checks that input value is masked on input update if the config is set to not show text", testAsync(async (done: DoneFn) => {
        await restartClarity({ showText: false });

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
        assert.equal(events[0].state.attributes.value, maskedValueString);
        done();
    }));

    it("checks that input value is masked on insert if the config is set to show text and mask attribute is applied",
        testAsync(async (done: DoneFn) => {
            await restartClarity({ showText: true });

            watch();
            let input = document.createElement("input");
            let valueString = "value";
            let maskedValueString = mask(valueString);
            input.setAttribute("value", valueString);
            input.setAttribute(ForceMaskAttribute, "true");
            document.body.appendChild(input);
            await waitFor(PubSubEvents.MUTATION);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 1);
            assert.equal(events[0].state.tag, "INPUT");
            assert.equal(events[0].state.action, Action.Insert);
            assert.equal(events[0].state.attributes["value"], maskedValueString);
            done();
        })
    );

});
