import { config } from "../src/config";
import * as core from "../src/core";
import uncompress from "./uncompress";
import { activateCore, cleanupFixture, setupFixture } from "./utils";
import { getAllSentBytes, getAllSentEvents, MockEventName, observeEvents, triggerMockEvent, triggerSend } from "./utils";

import * as chai from "chai";

let assert = chai.assert;
let instrumentationEventName = "Instrumentation";

describe("Functional Tests", () => {
  let limit = config.batchLimit;
  let base64img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  beforeEach(setupFixture);
  afterEach(cleanupFixture);

  it("validates that missing feature event is sent when required feature is missing", (done) => {
    core.teardown();

    // Function.prototype.bind is a required API for Clarity to work
    // Mocking a browser that doesn't support it by temporarily deleting it
    let originalBind = Function.prototype.bind;
    delete Function.prototype.bind;
    activateCore();
    Function.prototype.bind = originalBind;

    let events = getAllSentEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.MissingFeature);
    assert.equal(events[1].type, instrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);

    done();
  });

  it("validates that modules work fine together", (done) => {
    let events = getAllSentEvents();
    assert.equal(events.length >= 10, true);
    done();
  });

  it("validates that custom sendCallback is invoked when passed through config", (done) => {
    let sendCount = 0;
    config.uploadHandler = (payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback) => {
      mockUploadHandler(payload);
      sendCount++;
    };
    triggerMockEvent();

    assert.equal(sendCount, 1);
    done();
  });

  it("validates that XhrError is logged for failed requests through the 'onFailure' upload callback ", (done) => {
    let stopObserving = observeEvents();
    let mockFailure = true;

    // Mock 1 failed request
    config.uploadHandler = (payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback) => {
      if (mockFailure) {
        onFailure(400);
        mockFailure = false;
      } else {
        mockUploadHandler(payload);

        // Explicitly skipping the reporting of successful delivery to avoid re-sending dropped event
        // and keep the focus on testing the 'onFailure' logging, rather than the 'onSuccess' re-delivery
        // onSuccess(200);
      }
    };

    triggerMockEvent();
    let events = stopObserving();

    // Not expecting any events to be sent quite yet at this point, because request with mock event failed
    // and generated XhrError instrumentation event doesn't get sent out on its own (edge case exception)
    assert.equal(events.length, 0);

    // Generate one more event to trigger proper upload
    let secondMockEventName = "SecondMockEvent";
    stopObserving = observeEvents();
    triggerMockEvent(secondMockEventName);
    events = stopObserving();

    assert.equal(events.length, 2);
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.XhrError);
    assert.equal(events[0].state.requestStatus, 400);
    assert.equal(events[1].type, secondMockEventName);

    done();
  });

  it("validates that dropped payloads are re-sent through the next request's 'onSuccess' callback", (done) => {
    let stopObserving = observeEvents();
    let mockFailure = true;
    let uploadInvocationCount = 0;

    // Mock 1 failed request
    config.uploadHandler = (payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback) => {
      if (mockFailure) {
        onFailure(400);
        mockFailure = false;
      } else {
        mockUploadHandler(payload);
        onSuccess(200);
      }
      uploadInvocationCount++;
    };

    triggerMockEvent();
    let events = stopObserving();

    // Not expecting any events to be sent quite yet at this point, because request with mock event failed
    // and generated XhrError instrumentation event doesn't get sent out on its own (edge case exception)
    assert.equal(events.length, 0);

    // Generate one more event to trigger proper upload
    let secondMockEventName = "SecondMockEvent";
    stopObserving = observeEvents();
    triggerMockEvent(secondMockEventName);
    events = stopObserving();

    // Upload invocations: First mock event, second mock event, first mock event re-upload
    assert.equal(uploadInvocationCount, 3);
    assert.equal(events.length, 3);
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.XhrError);
    assert.equal(events[0].state.requestStatus, 400);
    assert.equal(events[1].type, secondMockEventName);
    assert.equal(events[2].type, MockEventName);

    done();
  });

  it("validates that re-send cycle doesn't enter an infinite loop when all requests fail", (done) => {
    let uploadInvocationCount = 0;

    // Mock fail all requests (e.g. dropped internet connection)
    config.uploadHandler = (payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback) => {
      onFailure(400);
      uploadInvocationCount++;
    };
    triggerMockEvent();
    triggerSend();

    let settledUploadInvocationCount = uploadInvocationCount;
    // Ensure that no new events are generated through 'try to report failure --> fail to deliver --> try to report failure' cycle
    for (let i = 0; i < 5; i++) {
      triggerSend();
      assert.equal(uploadInvocationCount, settledUploadInvocationCount);
    }

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

    core.addEvent({
      type: eventName,
      state: { data: eventOneData }
    });
    core.addEvent({
      type: eventName,
      state: { data: eventTwoData }
    });

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

    core.addEvent({
      type: eventName,
      state: { data: eventOneData }
    });
    core.addEvent({
      type: eventName,
      state: { data: eventTwoData }
    });

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
    core.addEvent({
      type: eventName,
      state: { data: eventData }
    });

    triggerSend();

    assert.equal(getAllSentBytes().length, expectedBytesLength);
    done();
  });

  it("validates that queued payload is sent on teardown", (done) => {
    triggerSend();
    let eventName = "CoreSendOnTeardownTest";
    let bytesLengthBefore = getAllSentBytes().length;
    let expectedBytesLength = bytesLengthBefore;

    core.addEvent({
      type: eventName,
      state: {}
    });
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
    core.addEvent({
      type: eventName,
      state: {}
    });
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
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.ClarityDuplicated);
    assert.equal(events[0].state.currentImpressionId, mockExistingImpressionId);
    assert.equal(events[1].type, instrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();
  });

  function mockUploadHandler(payload: string) {
    payload = JSON.stringify(payload);
    let xhr = new XMLHttpRequest();
    xhr.open("POST", config.uploadUrl);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(payload);
  }
});
