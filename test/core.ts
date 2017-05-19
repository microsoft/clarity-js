import { config } from "../src/config";
import * as core from "../src/core";
import { InstrumentationEventName } from "../src/instrumentation";
import uncompress from "../src/uncompress";
import { activateCore, cleanupFixture, getAllSentBytes, getAllSentEvents, setupFixture, triggerSend } from "./utils";

import * as chai from "chai";
import "../src/layout/layout";
import "../src/pointer";
import "../src/viewport";

let assert = chai.assert;

describe("Functional Tests", () => {
  let limit = config.batchLimit;
  let base64img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  beforeEach(setupFixture);
  afterEach(cleanupFixture);

  it("validates that modules work fine together", (done) => {
    let events = getAllSentEvents();
    assert.equal(events.length >= 10, true);
    done();
  });

  it("validates that custom sendCallback is invoked when passed through config", (done) => {
    let sendCount = 0;
    config.sendCallback = () => {
      sendCount++;
    };

    let eventName = "Send Callback Test";
    core.addEvent(eventName, null);
    triggerSend();

    assert.equal(sendCount, 1);
    done();
  });

  it("validates that multiple bindings with same event name get bound correctly", (done) => {
    let img = document.createElement("img");
    let firstHandlerFired = false;
    let secondHandlerFired = false;

    function firstHandler() {
      firstHandlerFired = true;
    }

    function secondHandler() {
      secondHandlerFired = true;
    }

    core.bind(img, "load", firstHandler);
    core.bind(img, "load", secondHandler);

    // Add a test callback to validate after-onload state
    img.addEventListener("load", onloadCallback, false);
    img.src = base64img;

    function onloadCallback(e) {
      assert.equal(firstHandlerFired, true);
      assert.equal(secondHandlerFired, true);
      done();
    }
  });

  it("validates that multiple bindings with same event name get unbound on teardown", (done) => {
    let img = document.createElement("img");
    let firstHandlerFired = false;
    let secondHandlerFired = false;

    function firstHandler() {
      firstHandlerFired = true;
    }

    function secondHandler() {
      secondHandlerFired = true;
    }

    core.bind(img, "load", firstHandler);
    core.bind(img, "load", secondHandler);
    core.teardown();

    // Add a test callback to validate after-onload state
    img.addEventListener("load", onloadCallback, false);
    img.src = base64img;

    function onloadCallback(e) {
      assert.equal(firstHandlerFired, false);
      assert.equal(secondHandlerFired, false);
      done();
    }
  });

  it("validates that events are batched for upload correctly when total length is below the limit", (done) => {
    triggerSend();
    let eventName = "CoreByteLimitTest";
    let bytesLengthBefore = getAllSentBytes().length;
    let expectedBytesLength = bytesLengthBefore + 1;

    let eventOneData = Array(Math.round(limit * (1 / 3))).join("1");
    let eventTwoData = Array(Math.round(limit * (1 / 3))).join("2");

    core.addEvent(eventName, { data: eventOneData });
    core.addEvent(eventName, { data: eventTwoData });

    triggerSend();

    assert.equal(getAllSentBytes().length, expectedBytesLength);
    done();
  });

  it("validates that events are batched for upload correctly when total length is above the limit", (done) => {
    triggerSend();
    let eventName = "CoreByteLimitTest";
    let bytesLengthBefore = getAllSentBytes().length;
    let expectedBytesLength = bytesLengthBefore + 2;

    let eventOneData = Array(Math.round(limit * (2 / 3))).join("1");
    let eventTwoData = Array(Math.round(limit / 2)).join("2");

    core.addEvent(eventName, { data: eventOneData });
    core.addEvent(eventName, { data: eventTwoData });

    triggerSend();

    assert.equal(getAllSentBytes().length, expectedBytesLength);
    done();
  });

  it("validates that single event is sent when its own length is above the limit", (done) => {
    triggerSend();
    let eventName = "CoreByteLimitTest";
    let bytesLengthBefore = getAllSentBytes().length;
    let expectedBytesLength = bytesLengthBefore + 1;

    let eventData = Array(Math.round(limit + 1)).join("1");
    core.addEvent(eventName, { data: eventData });

    triggerSend();

    assert.equal(getAllSentBytes().length, expectedBytesLength);
    done();
  });

  it("validates that queued payload is sent on teardown", (done) => {
    triggerSend();
    let eventName = "CoreSendOnTeardownTest";
    let bytesLengthBefore = getAllSentBytes().length;
    let expectedBytesLength = bytesLengthBefore;

    core.addEvent(eventName, {});
    assert.equal(getAllSentBytes().length, expectedBytesLength);

    expectedBytesLength += 1;
    core.teardown();
    assert.equal(getAllSentBytes().length, expectedBytesLength);

    done();
  });

  it("validates that Clarity tears down when total byte limit is exceeded", (done) => {
    assert.equal(core.state, State.Activated);

    let originalTotalLimit = config.totalLimit;
    let currentSentBytesCount = 0;
    let eventName = "CoreByteLimitTest";
    let bytes = getAllSentBytes();

    for (let i = 0; i < bytes.length; i++) {
      currentSentBytesCount += bytes[i].length;
    }

    config.totalLimit = currentSentBytesCount + 1;
    core.addEvent(eventName, {});
    triggerSend();

    config.totalLimit = originalTotalLimit;
    assert.equal(core.state, State.Unloaded);

    done();
  });

  it("validates that Clarity tears down on activate, when another instance of Clarity is already activated", (done) => {
    core.teardown();
    document[core.ClarityAttribute] = 1;
    activateCore();
    assert.equal(core.state, State.Unloaded);
    done();
  });

  it("validates that Clarity logs instrumentation, when another instance of Clarity is already activated", (done) => {
    let mockExistingImpressionId = "1";
    core.teardown();
    document[core.ClarityAttribute] = mockExistingImpressionId;
    activateCore();

    let events = getAllSentEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, InstrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.ClarityDuplicated);
    assert.equal(events[0].state.currentImpressionId, mockExistingImpressionId);
    assert.equal(events[1].type, InstrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();
  });
});
