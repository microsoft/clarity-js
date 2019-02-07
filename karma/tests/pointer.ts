import { getTimestamp } from "@src/core";
import { assert } from "chai";
import { cleanupPage, setupPage } from "../setup/page";
import { PubSubEvents, waitFor } from "../setup/pubsub";
import { testAsync } from "../setup/testasync";
import { stopWatching, watch } from "../setup/watch";

let distanceThreshold = 20;
let timeThreshold = 500;

describe("Pointer Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("validates that mouse events are processed by clarity", testAsync(async (done: DoneFn) => {
        watch();

        // Trigger mousemove events followed by a click event
        let dom = document.getElementById("clarity");
        let x = 250;
        let xDelta = (distanceThreshold + 1);
        triggerMouseEvent(dom, "mousemove", x, 100);
        triggerMouseEvent(dom, "mousemove", x + xDelta, 100);
        triggerMouseEvent(dom, "mousemove", x + (xDelta * 2), 100);
        triggerMouseEvent(dom, "click", 260, 100);
        await waitFor(PubSubEvents.CLICK);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 4);
        assert.equal(events[0].state.event, "mousemove");
        assert.equal(events[0].state.x, x);
        assert.equal(events[1].state.event, "mousemove");
        assert.equal(events[1].state.x, x + xDelta);
        assert.equal(events[2].state.event, "mousemove");
        assert.equal(events[2].state.x, x + (xDelta * 2));
        assert.equal(events[3].state.event, "click");
        done();
    }));

    // Make sure that we don't record mouse events that are too close to each other
    it("validates that mouse events are throttled by distance", testAsync(async (done: DoneFn) => {
        watch();

        // Trigger mousemove events followed by a click event
        let dom = document.getElementById("clarity");
        let x = 250;
        let xDelta = Math.ceil(distanceThreshold / 2) + 1;
        triggerMouseEvent(dom, "mousemove", x, 100);
        triggerMouseEvent(dom, "mousemove", x + xDelta, 100);
        triggerMouseEvent(dom, "mousemove", x + (xDelta * 2), 100);
        triggerMouseEvent(dom, "click", 260, 100);
        await waitFor(PubSubEvents.CLICK);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 3);
        assert.equal(events[0].state.event, "mousemove");
        assert.equal(events[0].state.x, x);
        assert.equal(events[1].state.event, "mousemove");
        assert.equal(events[1].state.x, x + (xDelta * 2));
        assert.equal(events[2].state.event, "click");
        done();
    }));

    // Make sure that we don't record mouse events that are too close to each other
    it("validates that mouse events are throttled by time", testAsync(async (done: DoneFn) => {
        watch();

        // Trigger mousemove events followed by a click event
        let dom = document.getElementById("clarity");
        let x = 250;
        triggerMouseEvent(dom, "mousemove", x, 100);
        triggerMouseEvent(dom, "mousemove", x, 100);

        let thresholdTs = getTimestamp(true) + (timeThreshold * 2);
        while (getTimestamp(true) < thresholdTs) {
            // Wait for time threadhold to expire
        }
        triggerMouseEvent(dom, "mousemove", x, 100);
        triggerMouseEvent(dom, "click", 260, 100);
        await waitFor(PubSubEvents.CLICK);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 3);
        assert.equal(events[0].state.event, "mousemove");
        assert.equal(events[0].state.x, x);
        assert.equal(events[1].state.event, "mousemove");
        assert.equal(events[1].state.x, x);
        assert.equal(events[2].state.event, "click");
        done();
    }));

    function triggerMouseEvent(target, type, x, y) {
        let mouseEvent;
        if (typeof MouseEvent !== "function") {
            mouseEvent = document.createEvent("MouseEvents");
            mouseEvent.initMouseEvent(
                type,
                true, // bubbles = true
                false, // cancellable = false
                window,
                0,
                x, // screenX
                y, // screenY
                x, // clientX
                y, // clientY
                false, // ctrlKey
                false, // altKey
                false, // shftKey
                false, // metaKey
                0, // button
                null // relatedTarget
            );
        } else {
            mouseEvent = new MouseEvent(type, {
                clientX: x,
                clientY: y,
                view: window,
                bubbles: true,
                cancelable: true
            });
        }
        target.dispatchEvent(mouseEvent);
    }
});
