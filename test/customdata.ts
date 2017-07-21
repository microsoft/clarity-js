import { config } from "../src/config";
import * as core from "../src/core";
import uncompress from "./uncompress";
import { cleanupFixture, observeEvents, setupFixture, triggerSend } from "./utils";

import * as chai from "chai";

let eventName = "Custom";
let assert = chai.assert;

describe("Custom Data Tests", () => {
  beforeEach(setupFixture);
  afterEach(cleanupFixture);

  it("validates that custom events are processed by clarity", (done) => {
    let dom = document.getElementById("clarity");
    let stopObserving = observeEvents(eventName);
    document.addEventListener("customtestdone", callback);

	triggerCustomEvent(dom, { type: "string", data: "string" });
	triggerCustomEvent(dom, { type: "object", data: { this: "is", an: "object" } });
	triggerCustomEvent(dom, { type: "array", data: ["a", "r", "r", "a", "y"] });

    // We need to yield so there's time to process events, so sent a sentinel event to
    // mark when the test events are done. This is better than the alternative of adding
    // a timeout.
    triggerTestDoneEvent(dom);

    function callback() {
      triggerSend();

      // Uncompress recent data from mutations
      let events = stopObserving();

      assert.equal(events.length, 3);
	  assert.equal(events[0].state.type, "string");
	  assert.equal(events[0].state.data, "string");
	  assert.equal(events[1].state.type, "object");
	  assert.deepEqual(events[1].state.data, { this: "is", an: "object" });
	  assert.equal(events[2].state.type, "array");
	  assert.deepEqual(events[2].state.data, ["a", "r", "r", "a", "y"]);

      document.removeEventListener("customtestdone", callback);
      done();
    }
  });

  function triggerCustomEvent(target, detail) {
    let clarityEvent;

    clarityEvent = document.createEvent("Event");
    clarityEvent.initEvent(
      "claritydata",
      true,
      false
    );
    clarityEvent.detail = detail;

    target.dispatchEvent(clarityEvent);
  }

  function triggerTestDoneEvent(target) {
    let clarityEvent;

    clarityEvent = document.createEvent("Event");
    clarityEvent.initEvent(
      "customtestdone",
      true,
      false
    );

    target.dispatchEvent(clarityEvent);
  }
});
