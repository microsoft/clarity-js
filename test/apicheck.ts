import { config } from "../src/config";
import * as core from "../src/core";
import { InstrumentationEventName } from "../src/instrumentation";
import { activateCore, cleanupFixture, getAllSentEvents, getEventsByType, observeEvents, setupFixture } from "./utils";

import * as chai from "chai";
import "../src/layout/layout";
import "../src/pointer";
import "../src/viewport";

let assert = chai.assert;

describe("ApiCheck Tests", () => {
  beforeEach(setupFixture);
  afterEach(cleanupFixture);

  it("validates that missing api event is sent when required api is missing", (done) => {
    core.teardown();

    // Function.protoype.bind is a required API for Clarity to work
    // Mocking a browser that doesn't support it by temporarily deleting it
    let originalBind = Function.prototype.bind;
    delete Function.prototype.bind;
    activateCore();
    Function.prototype.bind = originalBind;

    let events = getAllSentEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, InstrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.ApiMissing);
    assert.equal(events[1].type, InstrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);

    done();
  });

  it("validates that missing api event is sent when optional api is missing, but clarity still activates ", (done) => {
    core.teardown();

    // Workaround the fact that compiler doesn't allow window.performance = value,
    // because it thinks that it is an immutable property (it's not)
    function setWindowProperty(property: string, value) {
      window[property] = value;
    }

    let originalPerformance = window.performance;
    setWindowProperty("performance", undefined);
    activateCore();

    assert.isAbove(getAllSentEvents().length, 1);

    let instrumentationEvents = getEventsByType(getAllSentEvents(), InstrumentationEventName);
    assert.isAtLeast(instrumentationEvents.length, 1);
    assert.equal(instrumentationEvents[0].state.type, Instrumentation.ApiMissing);

    setWindowProperty("performance", originalPerformance);
    done();
  });
});
