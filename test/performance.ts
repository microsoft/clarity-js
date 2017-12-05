import { config } from "../src/config";
import * as core from "../src/core";
import { cleanupFixture, getSentEvents, setupFixture } from "./testsetup";
import { getEventsByOrigin, observeEvents } from "./utils";

import * as chai from "chai";

let assert = chai.assert;
let performancePollTimeoutLength = 1000;

describe("Performance Tests", () => {
  let originalPerformance: Performance;
  let dummyPerformance;
  let dummyResourceTimings;

  beforeEach(() => {
    resetDummies();
    originalPerformance = window.performance;
    setWindowProperty("performance", dummyPerformance);
    setupFixture(["performance"]);
  });

  afterEach(() => {
    setWindowProperty("performance", originalPerformance);
    cleanupFixture();
  });

  it("checks that w3c performance timing is logged by clarity", (done: DoneFn) => {
    // Timings are checked in an interval, so it needs additional time to re-invoke the check
    fastForwardToNextPerformancePoll();
    let events = getEventsByOrigin(getSentEvents(), Origin.Performance);
    assert.equal(events.length, 1);

    let timing = events[0].data;
    assert.equal(!!timing, true);
    assert.equal(timing.responseEnd, dummyPerformance.timing.responseEnd);

    done();
  });

  it("checks that network resource timings are logged by clarity", (done: DoneFn) => {
    let stopObserving = observeEvents(Origin.Performance);
    let dummyEntry = { initiatorType: "dummy", responseEnd: 1 };
    dummyResourceTimings.push(dummyEntry);
    fastForwardToNextPerformancePoll();

    let events = stopObserving();
    assert.equal(events.length, 1);

    let entries = events[0].data;
    assert.equal(!!entries, true);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].initiatorType, dummyEntry.initiatorType);

    done();
  });

  it("checks that multiple network resource timings are logged together", (done: DoneFn) => {
    let stopObserving = observeEvents(Origin.Performance);
    dummyResourceTimings.push({ responseEnd: 1 });
    dummyResourceTimings.push({ responseEnd: 1 });

    // Timings are checked in an interval, so it needs additional time to re-invoke the check
    fastForwardToNextPerformancePoll();
    let events = stopObserving();
    assert.equal(events.length, 1);

    let entries = events[0].data;
    assert.equal(entries.length, 2);

    done();
  });

  it("checks that error is logged when entries are cleared", (done: DoneFn) => {
    let stopObserving = observeEvents(Origin.Performance);
    dummyResourceTimings.push({ responseEnd: 1 });
    fastForwardToNextPerformancePoll();

    let events = stopObserving();
    assert.equal(events.length, 1);

    stopObserving = observeEvents(Origin.Instrumentation);
    dummyResourceTimings = [];
    fastForwardToNextPerformancePoll();

    events = stopObserving();
    assert.equal(events.length, 1);

    done();
  });

  it("checks that incomplete entries are not logged initially, but then revisited", (done: DoneFn) => {
    let completeEntry = { responseEnd: 1, initiatorType: "completeEntry" };
    let incompleteEntry = { responseEnd: 0, initiatorType: "incompleteEntry" };
    let stopObserving = observeEvents(Origin.Performance);
    dummyResourceTimings.push(completeEntry);
    dummyResourceTimings.push(incompleteEntry);
    fastForwardToNextPerformancePoll();

    let events = stopObserving();
    assert.equal(events.length, 1);

    let entries = events[0].data;
    assert.equal(entries.length, 1);
    assert.equal(entries[0].initiatorType, "completeEntry");

    // Adjust the entry to have a valid response end time and wait for snapshot to propagate
    stopObserving = observeEvents(Origin.Performance);
    incompleteEntry.responseEnd = 1;
    fastForwardToNextPerformancePoll();

    events = stopObserving();
    assert.equal(events.length, 1);

    entries = events[0].data;
    assert.equal(entries.length, 1);
    assert.equal(entries[0].initiatorType, "incompleteEntry");

    done();
  });

  // Workaround the fact that compiler doesn't allow window.performance = value,
  // because it thinks that it is an immutable property (it's not)
  function setWindowProperty(property: string, value) {
    window[property] = value;
  }

  function dummyGetEntriesByType() {
    return dummyResourceTimings;
  }

  function resetDummies() {
    dummyPerformance = {
      timing: {
        loadEventEnd: 1,
        responseEnd: -1,
        navigationStart: 0,
      },
      getEntriesByType: dummyGetEntriesByType
    };
    dummyResourceTimings = [];
  }

  function fastForwardToNextPerformancePoll() {
    jasmine.clock().tick(performancePollTimeoutLength + 1);
  }
});
