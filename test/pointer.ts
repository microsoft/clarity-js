import { config } from "../src/config";
import * as core from "../src/core";
import uncompress from "./uncompress";
import { cleanupFixture, observeEvents, setupFixture } from "./utils";

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

  it("validates that mouse events are processed by clarity", (done) => {
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
    let stopObserving = observeEvents(eventName);
    document.addEventListener("click", callback);

    // Trigger mousemove events followed by a click event
    let x = 250;
    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "mousemove", x, 100);

    let thresholdTs = core.getTimestamp(true) + (timeThreshold * 2);
    while (core.getTimestamp(true) < thresholdTs) {
      // Wait for time threadhold to expire
    }

    triggerMouseEvent(dom, "mousemove", x, 100);
    triggerMouseEvent(dom, "click", 260, 100);

    function callback() {
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
