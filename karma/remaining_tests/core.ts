import { config } from "../../src/config";
import * as core from "../../src/core";
import { ICompressedBatchMessage, IEnvelope, IEventArray, Instrumentation, IPayload, State, WorkerMessageType } from "../../types/index";
import { activateCore, cleanupFixture, getSentEvents, setupFixture } from "../setup/testsetup";
import { getMockEvent, MockEventName, observeEvents, observeWorkerMessages, payloadToEvents } from "../setup/utils";
import uncompress from "./uncompress";

import * as chai from "chai";
let assert = chai.assert;

describe("Core Tests", () => {
  let base64img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

  beforeEach(() => {
    setupFixture([]);
  });
  afterEach(cleanupFixture);

  it("validates that core.ts version matches package.json", (done: DoneFn) => {
    let testJsons = window["__test_jsons"];
    let packageJson = testJsons && testJsons["package"];
    assert.equal(packageJson.version, core.version);
    done();
  });

  it("validates that missing feature event is sent when required feature is missing", (done: DoneFn) => {
    core.teardown();
    observeEvents();

    // Function.prototype.bind is a required API for Clarity to work
    // Mocking a browser that doesn't support it by temporarily deleting it
    let originalBind = Function.prototype.bind;
    delete Function.prototype.bind;
    activateCore();
    Function.prototype.bind = originalBind;

    let events = getSentEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, core.InstrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.MissingFeature);
    assert.equal(events[1].type, core.InstrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();
  });

  it("validates that error during clarity activate is caught and logged correctly", (done: DoneFn) => {
    core.teardown();
    observeEvents();
    let originalWorker = Worker;
    let mockErrorText = "Mock Worker error!";
    (Worker as any) = () => {
      throw new Error(mockErrorText);
    };
    activateCore();
    Worker = originalWorker;

    let events = getSentEvents();
    assert.equal(events.length, 2);
    assert.equal(events[0].type, core.InstrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.ClarityActivateError);
    assert.equal(events[0].state.error, mockErrorText);
    assert.equal(events[1].type, core.InstrumentationEventName);
    assert.equal(events[1].state.type, Instrumentation.Teardown);
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
    assert.equal(events[0].type, core.InstrumentationEventName);
    assert.equal(events[0].state.type, Instrumentation.ClarityDuplicated);
    assert.equal(events[0].state.currentImpressionId, mockExistingImpressionId);
    assert.equal(events[1].type, core.InstrumentationEventName);
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
    let events = payloadToEvents(uncompressedPayload);
    assert.equal(events.length, 2);
    assert.equal(events[0].type, MockEventName);
    assert.equal(events[1].type, "Instrumentation");
    assert.equal(events[1].state.type, Instrumentation.Teardown);
    done();

    function mockUploadHandler(payload: string) {
      sentBytes.push(payload);
    }
  });

  it("validates that upload queue is flushed when Clarity trigger is fired", (done: DoneFn) => {
    let sentBytes: string[] = [];
    let mockCompressedData = "MockCompressedData";
    let mockRawData: IPayload = { envelope: {} as IEnvelope, events: [] as IEventArray[] };
    let mockCompressedBatchMessage: ICompressedBatchMessage = {
      type: WorkerMessageType.CompressedBatch,
      compressedData: mockCompressedData,
      rawData: mockRawData
    };
    let mockCompressedMessageEvent = {
      data: mockCompressedBatchMessage
    };
    core.teardown();

    // Set up test config
    config.backgroundMode = true;
    config.uploadHandler = mockUploadHandler;
    activateCore();

    // This even should not get sent until trigger is fired
    core.onWorkerMessage(mockCompressedMessageEvent as MessageEvent);
    assert.equal(sentBytes.length, 0);

    core.onTrigger("MockTrigger");
    assert.equal(sentBytes.length, 1);
    assert.equal(sentBytes[0], mockCompressedData);
    done();

    function mockUploadHandler(payload: string) {
      sentBytes.push(payload);
    }
  });

  it("validates that trigger instrumentation is logged when Clarity trigger is fired", (done: DoneFn) => {
    let mockTriggerKey = "MockTrigger";
    core.teardown();

    // Set up test config
    config.backgroundMode = true;
    activateCore();

    let stopObserving = observeEvents("Instrumentation");
    core.onTrigger(mockTriggerKey);

    let events = stopObserving();
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "Instrumentation");
    assert.equal(events[0].state.type, Instrumentation.Trigger);
    assert.equal(events[0].state.key, mockTriggerKey);
    done();
  });

  it("validates that nothing is sent on teardown when trigger was never fired", (done: DoneFn) => {
    let sentBytes: string[] = [];
    core.teardown();

    // Set up test config
    config.backgroundMode = true;
    config.uploadHandler = mockUploadHandler;
    activateCore();

    let mockEvent = getMockEvent();
    core.addEvent(mockEvent);
    core.teardown();

    assert.equal(sentBytes.length, 0);
    done();

    function mockUploadHandler(payload: string) {
      sentBytes.push(payload);
    }
  });
});
