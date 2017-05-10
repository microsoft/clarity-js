import { config } from "../src/config";
import * as core from "../src/core";
import { DistanceThreshold, PointerEventName, TimeThreshold } from "../src/pointer";
import uncompress from "../src/uncompress";
import { cleanupFixture, observeEvents, setupFixture, triggerSend } from "./utils";

import * as chai from "chai";
import "../src/layout/layout";
import "../src/pointer";
import "../src/viewport";

let assert = chai.assert;

describe("Pointer Tests", () => {

  beforeEach(setupFixture);
  afterEach(cleanupFixture);

  it("validates that mouse events are processed by clarity", (done) => {
    let dom = document.getElementById("clarity");
    let stopObserving = observeEvents(PointerEventName);
    document.addEventListener("click", callback);

    // Trigger mousemove events followed by a click event
    let x = 250;
    let xDelta = (DistanceThreshold + 1);
    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "mousemove", x + xDelta, 100);
    triggerMouseEvent(dom, "mousemove", x + (xDelta * 2), 100);
    triggerMouseEvent(dom, "click", 260, 100);

    function callback() {
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 4);
      assert.equal(events[0].state.event, "mousemove");
      assert.equal(events[0].state.x, x);
      assert.equal(events[1].state.event, "mousemove");
      assert.equal(events[1].state.x, x + xDelta);
      assert.equal(events[2].state.event, "mousemove");
      assert.equal(events[2].state.x, x + (xDelta * 2));
      assert.equal(events[3].state.event, "click");

      document.removeEventListener("click", callback);
      done();
    }
  });

  // Make sure that we don't record mouse events that are too close to each other
  it("validates that mouse events are throttled by distance", (done) => {
    let dom = document.getElementById("clarity");
    let stopObserving = observeEvents(PointerEventName);
    document.addEventListener("click", callback);

    // Trigger mousemove events followed by a click event
    let x = 250;
    let xDelta = Math.ceil(DistanceThreshold / 2) + 1;
    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "mousemove", x + xDelta, 100);
    triggerMouseEvent(dom, "mousemove", x + (xDelta * 2), 100);
    triggerMouseEvent(dom, "click", 260, 100);

    function callback() {
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 3);
      assert.equal(events[0].state.event, "mousemove");
      assert.equal(events[0].state.x, x);
      assert.equal(events[1].state.event, "mousemove");
      assert.equal(events[1].state.x, x + (xDelta * 2));
      assert.equal(events[2].state.event, "click");

      document.removeEventListener("click", callback);
      done();
    }
  });

  // Make sure that we don't record mouse events that are too close to each other
  it("validates that mouse events are throttled by time", (done) => {
    let dom = document.getElementById("clarity");
    let stopObserving = observeEvents(PointerEventName);
    document.addEventListener("click", callback);

    // Trigger mousemove events followed by a click event
    let x = 250;
    triggerMouseEvent(dom, "mousemove", x, 100);

    let thresholdTs = core.getTimestamp(true) + TimeThreshold + 1;
    while (core.getTimestamp(true) < thresholdTs) {
      // Wait for time threadhold to expire
    }

    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "click", 260, 100);

    function callback() {
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 3);
      assert.equal(events[0].state.event, "mousemove");
      assert.equal(events[0].state.x, x);
      assert.equal(events[1].state.event, "mousemove");
      assert.equal(events[1].state.x, x);
      assert.equal(events[2].state.event, "click");

      document.removeEventListener("click", callback);
      done();
    }
  });

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
