import { config } from "../src/config";
import * as core from "../src/core";
import { activateCore, cleanupFixture, getSentEvents, setupFixture } from "./testsetup";
import uncompress from "./uncompress";
import { getMockEnvelope, getMockEvent, MockEventName, observeEvents, observeWorkerMessages, postCompressedBatch } from "./utils";

import * as chai from "chai";
let assert = chai.assert;
let instrumentationEventName = "Instrumentation";

describe("Core Tests", () => {
  let limit = config.batchLimit;
  let base64img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  beforeEach(() => {
    setupFixture([]);
  });
  afterEach(cleanupFixture);

  it("validates that missing feature event is sent when required feature is missing", (done: DoneFn) => {
    core.teardown();
    let stopObserving = observeEvents();

    // Function.prototype.bind is a required API for Clarity to work
    // Mocking a browser that doesn't support it by temporarily deleting it
    let originalBind = Function.prototype.bind;
    delete Function.prototype.bind;
    activateCore();
    Function.prototype.bind = originalBind;

    let events = getSentEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.MissingFeature);
    assert.equal(events[1].type, instrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();
  });

  it("validates that error during clarity activate is caught and logged correctly", (done: DoneFn) => {
    core.teardown();
    let stopObserving = observeEvents();
    let originalWorker = Worker;
    let mockErrorText = "Mock Worker error!";
    (Worker as any) = () => {
      throw new Error(mockErrorText);
    };
    activateCore();
    Worker = originalWorker;

    let events = getSentEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.ClarityActivateError);
    assert.equal(events[0].state.error, mockErrorText);
    assert.equal(events[1].type, instrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();
  });

  it("validates that custom sendCallback is invoked when passed through config", (done: DoneFn) => {
    let sendCount = 0;
    config.uploadHandler = (payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback) => {
      sendCount++;
    };

    let stopObserving = observeEvents();
    let mockEvent = getMockEvent();
    postCompressedBatch([mockEvent]);

    assert.equal(sendCount, 1);
    done();
  });

  it("validates that XhrError is logged for failed requests through the 'onFailure' upload callback ", (done: DoneFn) => {
    config.uploadHandler = (payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback) => {
      // Suppose XHR was opened and returned a 400 code
      onFailure(400);
    };

    let stopObserving = observeEvents();
    let mockEvent = getMockEvent();
    postCompressedBatch([mockEvent]);

    let events = stopObserving();
    assert.equal(events.length, 1);
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.XhrError);
    assert.equal(events[0].state.requestStatus, 400);
    done();
  });

  it("validates that dropped payloads are re-sent through the next request's 'onSuccess' callback", (done: DoneFn) => {
    let mockFailure = true;
    let uploadInvocationCount = 0;
    let attemptedPayloads: string[] = [];

    // Mock 1 failed request
    config.uploadHandler = (payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback) => {
      attemptedPayloads[uploadInvocationCount] = payload;
      uploadInvocationCount++;
      if (mockFailure) {
        onFailure(400);
        mockFailure = false;
      } else {
        onSuccess(200);
      }
    };

    // Part 1: Mock an XHR failure, so that dropped payload is stored for re-delivery
    let stopObserving = observeEvents();
    let firstMockEventName = "FirstMockEvent";
    let firstMockEvent = getMockEvent(firstMockEventName);
    let firstEnvelope = getMockEnvelope(0);
    postCompressedBatch([firstMockEvent], firstEnvelope);

    // Ensure XHR failure is logged
    let events = stopObserving();
    assert.equal(events.length, 1);
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.XhrError);
    assert.equal(events[0].state.requestStatus, 400);

    // Part 2: Successfully send second payload, which should trigger re-send of the first payload
    let secondMockEventName = "SecondMockEvent";
    let secondMockEvent = getMockEvent(secondMockEventName);
    let secondEnvelope = getMockEnvelope(1);
    postCompressedBatch([secondMockEvent], secondEnvelope);

    // Upload invocations: First payload, second payload, first payload re-upload
    assert.equal(attemptedPayloads.length, 3);

    let firstPayload = JSON.parse(uncompress(attemptedPayloads[0]));
    let secondPayload = JSON.parse(uncompress(attemptedPayloads[1]));
    let thirdPayload = JSON.parse(uncompress(attemptedPayloads[2]));

    // Verify first payload
    assert.equal(firstPayload.envelope.sequenceNumber, 0);
    assert.equal(firstPayload.events.length, 1);
    assert.equal(firstPayload.events[0].type, firstMockEventName);

    // Verify second payload
    assert.equal(secondPayload.envelope.sequenceNumber, 1);
    assert.equal(secondPayload.events.length, 1);
    assert.equal(secondPayload.events[0].type, secondMockEventName);

    // Verify third payload
    assert.equal(thirdPayload.envelope.sequenceNumber, 0);
    assert.equal(thirdPayload.events.length, 1);
    assert.equal(thirdPayload.events[0].type, firstMockEventName);

    done();
  });

  it("validates that multiple bindings with same event name get bound correctly", (done: DoneFn) => {
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

  it("validates that multiple bindings with same event name get unbound on teardown", (done: DoneFn) => {
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

  it("validates that Clarity tears down and logs instrumentation when total byte limit is exceeded", (done: DoneFn) => {
    assert.equal(core.state, State.Activated);

    let stopObserving = observeEvents("Instrumentation");
    config.totalLimit = 0;
    let mockEvent = getMockEvent();
    postCompressedBatch([mockEvent]);

    let events = stopObserving();
    assert.equal(core.state, State.Unloaded);
    assert.equal(events.length, 2);
    assert.equal(events[0].state.type, Instrumentation.TotalByteLimitExceeded);
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();
  });

  it("validates that Clarity tears down on activate, when another instance of Clarity is already activated", (done: DoneFn) => {
    core.teardown();
    document[core.ClarityAttribute] = 1;
    activateCore();
    assert.equal(core.state, State.Unloaded);
    done();
  });

  it("validates that Clarity logs instrumentation, when another instance of Clarity is already activated", (done: DoneFn) => {
    let mockExistingImpressionId = "1";
    core.teardown();
    document[core.ClarityAttribute] = mockExistingImpressionId;
    activateCore();

    let events = getSentEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, instrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.ClarityDuplicated);
    assert.equal(events[0].state.currentImpressionId, mockExistingImpressionId);
    assert.equal(events[1].type, instrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();
  });

  it("validates that force upload message is sent after config.delay milliseconds without new events", (done: DoneFn) => {
    let mockEvent = getMockEvent();
    core.addEvent(mockEvent);

    let stopObserving = observeWorkerMessages();
    // Fast forward to force upload
    jasmine.clock().tick(config.delay + 1);

    let workerMessages = stopObserving();
    assert.equal(workerMessages.length, 1);
    assert.equal(workerMessages[0].type, WorkerMessageType.ForceCompression);
    done();
  });

  it("validates that force upload timeout is pushed back with each new event", (done: DoneFn) => {
    let mockEvent = getMockEvent();
    let eventCount = 10;
    let stopObserving = observeWorkerMessages();

    for (let i = 0; i < eventCount; i++) {
      core.addEvent(mockEvent);
      jasmine.clock().tick(config.delay * (2 / 3));
    }
    jasmine.clock().tick(config.delay * (1 / 3));

    let workerMessages = stopObserving();
    assert.equal(workerMessages.length, eventCount + 1);
    for (let i = 0; i < eventCount; i++) {
      assert.equal(workerMessages[i].type, WorkerMessageType.AddEvent);
    }
    assert.equal(workerMessages[eventCount].type, WorkerMessageType.ForceCompression);
    done();
  });

  it("validates that pending events are sent on teardown", (done: DoneFn) => {
    let sentBytes: string[] = [];
    let mockEvent = getMockEvent();
    config.uploadHandler = mockUploadHandler;
    core.addEvent(mockEvent);
    core.teardown();

    assert.equal(sentBytes.length, 1);

    let uncompressedPayload = JSON.parse(uncompress(sentBytes[0]));
    let events = uncompressedPayload.events as IEvent[];
    assert.equal(events.length, 2);
    assert.equal(events[0].type, MockEventName);
    assert.equal(events[1].type, "Instrumentation");
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();

    function mockUploadHandler(payload: string) {
      sentBytes.push(payload);
    }
  });

  it("validates that pending uploads are sent when Clarity trigger is fired", (done: DoneFn) => {
    let sentBytes: string[] = [];
    let mockEvent = getMockEvent();
    let mockCompressedData = "MockCompressedData";
    let mockRawData = "MockRawData";
    let mockCompressedBatchMessage: ICompressedBatchMessage = {
      type: WorkerMessageType.CompressedBatch,
      compressedData: mockCompressedData,
      rawData: mockRawData,
      eventCount: 1
    };
    let mockCompressedMessageEvent = {
      data: mockCompressedBatchMessage
    };
    core.teardown();

    // Set up test config
    config.waitForTrigger = true;
    config.uploadHandler = mockUploadHandler;
    activateCore();

    // This even should not get sent until trigger is fired
    core.onWorkerMessage(mockCompressedMessageEvent as MessageEvent);
    assert.equal(sentBytes.length, 0);

    core.onTrigger();
    assert.equal(sentBytes.length, 1);
    assert.equal(sentBytes[0], mockCompressedData);
    done();

    function mockUploadHandler(payload: string) {
      sentBytes.push(payload);
    }
  });
});
