import { config } from "../src/config";
import * as core from "../src/core";
import { ResourceTimingEventType, StateErrorEventType, TimingEventType } from "../src/performance";
import { cleanupFixture, getAllSentEvents, getEventsByType, observeEvents, setupFixture, triggerSend } from "./utils";

import * as chai from "chai";
import "../src/performance";

let assert = chai.assert;

describe("Performance Tests", () => {
  let originalPerformance: Performance;
  let dummyPerformance;
  let dummyResourceTimings;

  beforeEach(() => {
    resetDummies();
    originalPerformance = window.performance;
    setWindowProperty("performance", dummyPerformance);
    setupFixture();
  });

  afterEach(() => {
    setWindowProperty("performance", originalPerformance);
    cleanupFixture();
  });

  it("checks that w3c performance timing is logged by clarity", (done) => {
    // Timings are checked in an interval, so it needs additional time to re-invoke the check
    triggerSend();
    let events = getEventsByType(getAllSentEvents(), TimingEventType);
    assert.equal(events.length, 1);

    let timing = events[0].state && events[0].state.timing;
    assert.equal(!!timing, true);
    assert.equal(timing.dummyResponseEnd, dummyPerformance.timing.dummyResponseEnd);

    done();
  });

  it("checks that network resource timings are logged by clarity", (done) => {
    let stopObserving = observeEvents(ResourceTimingEventType);
    let dummyEntry = { initiatorType: "dummy", responseEnd: 1 };
    dummyResourceTimings.push(dummyEntry);
    triggerSend();

    let events = stopObserving();
    assert.equal(events.length, 1);

    let entries = events[0].state && events[0].state.entries;
    assert.equal(!!entries, true);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].initiatorType, dummyEntry.initiatorType);

    done();
  });

  it("checks that multiple network resource timings are logged together", (done) => {
    let stopObserving = observeEvents(ResourceTimingEventType);
    dummyResourceTimings.push({ responseEnd: 1 });
    dummyResourceTimings.push({ responseEnd: 1 });

    // Timings are checked in an interval, so it needs additional time to re-invoke the check
    triggerSend();
    let events = stopObserving();
    assert.equal(events.length, 1);

    let entries = events[0].state.entries;
    assert.equal(entries.length, 2);

    done();
  });

  it("checks that error is logged when entries are cleared", (done) => {
    let stopObserving = observeEvents(ResourceTimingEventType);
    dummyResourceTimings.push({ responseEnd: 1 });
    triggerSend();

    let events = stopObserving();
    assert.equal(events.length, 1);

    stopObserving = observeEvents(StateErrorEventType);
    dummyResourceTimings = [];
    triggerSend();

    events = stopObserving();
    assert.equal(events.length, 1);

    done();
  });

  it("checks that incomplete entries are not logged initially, but then revisited", (done) => {
    let completeEntry = { responseEnd: 1, initiatorType: "completeEntry" };
    let incompleteEntry = { responseEnd: 0, initiatorType: "incompleteEntry" };
    let stopObserving = observeEvents(ResourceTimingEventType);
    dummyResourceTimings.push(completeEntry);
    dummyResourceTimings.push(incompleteEntry);
    triggerSend();

    let events = stopObserving();
    assert.equal(events.length, 1);

    let entries = events[0].state.entries;
    assert.equal(entries.length, 1);
    assert.equal(entries[0].initiatorType, "completeEntry");

    // Adjust the entry to have a valid response end time and wait for snapshot to propagate
    stopObserving = observeEvents(ResourceTimingEventType);
    incompleteEntry.responseEnd = 1;
    triggerSend();

    events = stopObserving();
    assert.equal(events.length, 1);

    entries = events[0].state.entries;
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
        dummyResponseEnd: -1,
        navigationStart: 0,
      },
      getEntriesByType: dummyGetEntriesByType
    };
    dummyResourceTimings = [];
  }
});
