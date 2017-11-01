import { config } from "../src/config";
import { getTimestamp } from "../src/core";
import { cleanupFixture, setupFixture } from "./testsetup";
import { observeEvents } from "./utils";

import * as chai from "chai";

let distanceThreshold = 20;
let eventName = "Pointer";
let timeThreshold = 500;
let assert = chai.assert;

describe("Pointer Tests", () => {

  beforeEach(() => {
    setupFixture(["pointer"]);
  });
  afterEach(cleanupFixture);

  it("validates that mouse events are processed by clarity", (done: DoneFn) => {
    let dom = document.getElementById("clarity");
    let stopObserving = observeEvents(eventName);
    document.addEventListener("click", callback);

    // Trigger mousemove events followed by a click event
    let x = 250;
    let xDelta = (distanceThreshold + 1);
    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "mousemove", x + xDelta, 100);
    triggerMouseEvent(dom, "mousemove", x + (xDelta * 2), 100);
    triggerMouseEvent(dom, "click", 260, 100);

    function callback() {
      document.removeEventListener("click", callback);
      let events = stopObserving();
      assert.equal(events.length, 4);
      assert.equal(events[0].data.state.type, "mousemove");
      assert.equal(events[0].data.state.x, x);
      assert.equal(events[1].data.state.type, "mousemove");
      assert.equal(events[1].data.state.x, x + xDelta);
      assert.equal(events[2].data.state.type, "mousemove");
      assert.equal(events[2].data.state.x, x + (xDelta * 2));
      assert.equal(events[3].data.state.type, "click");
      done();
    }
  });

  // Make sure that we don't record mouse events that are too close to each other
  it("validates that mouse events are throttled by distance", (done: DoneFn) => {
    let dom = document.getElementById("clarity");
    let stopObserving = observeEvents(eventName);
    document.addEventListener("click", callback);

    // Trigger mousemove events followed by a click event
    let x = 250;
    let xDelta = Math.ceil(distanceThreshold / 2) + 1;
    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "mousemove", x + xDelta, 100);
    triggerMouseEvent(dom, "mousemove", x + (xDelta * 2), 100);
    triggerMouseEvent(dom, "click", 260, 100);

    function callback() {
      document.removeEventListener("click", callback);
      let events = stopObserving();
      assert.equal(events.length, 3);
      assert.equal(events[0].data.state.type, "mousemove");
      assert.equal(events[0].data.state.x, x);
      assert.equal(events[1].data.state.type, "mousemove");
      assert.equal(events[1].data.state.x, x + (xDelta * 2));
      assert.equal(events[2].data.state.type, "click");
      done();
    }
  });

  // Make sure that we don't record mouse events that are too close to each other
  it("validates that mouse events are throttled by time", (done: DoneFn) => {
    let dom = document.getElementById("clarity");
    let stopObserving = observeEvents(eventName);
    document.addEventListener("click", callback);

    // Trigger mousemove events followed by a click event
    let x = 250;
    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "mousemove", x, 100);

    let thresholdTs = getTimestamp(true) + (timeThreshold * 2);
    while (getTimestamp(true) < thresholdTs) {
      // Wait for time threadhold to expire
    }

    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "click", 260, 100);

    function callback() {
      document.removeEventListener("click", callback);
      let events = stopObserving();
      assert.equal(events.length, 3);
      assert.equal(events[0].data.state.type, "mousemove");
      assert.equal(events[0].data.state.x, x);
      assert.equal(events[1].data.state.type, "mousemove");
      assert.equal(events[1].data.state.x, x);
      assert.equal(events[2].data.state.type, "click");
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
