import { createCompressionWorker } from "./../src/compressionworker";
import { config } from "./../src/config";
import * as core from "./../src/core";
import { cleanupFixture, setupFixture } from "./testsetup";
import { getMockEnvelope, getMockEvent, MockEventName, observeEvents } from "./utils";

import * as chai from "chai";

const InstrumentationEventName = "Instrumentation";
const WorkerMessageWaitTime = 1000;
let assert = chai.assert;

describe("Compression Worker Tests", () => {
  let workerMessages: IWorkerMessage[] = [];
  let testFailureTimeout: number = null;
  let processMessage: (message: IWorkerMessage) => void = null;

  beforeEach(() => {
    setupFixture([]);
    workerMessages = [];
    processMessage = (message: IWorkerMessage) => {
      // Default handler is empty
    };
  });
  afterEach(() => {
    cleanupFixture();
    clearTimeout(testFailureTimeout);
  });

  it("validates that events are batched for upload correctly when total length is below the limit", (done: DoneFn) => {
    let worker = createTestWorker();
    let firstMockEventName = "FirstMockEvent";
    let secondMockEventName = "SecondMockEvent";
    let firstMockEvent = getMockEvent(firstMockEventName);
    let secondMockEvent = getMockEvent(secondMockEventName);
    let addEventMessage = createAddEventMessage(firstMockEvent);
    let forceCompressionMsg = createForceCompressionMessage();

    worker.postMessage(addEventMessage);
    addEventMessage.event = secondMockEvent;
    worker.postMessage(addEventMessage);
    worker.postMessage(forceCompressionMsg);

    processMessage = (message: IWorkerMessage) => {
      assert.equal(message.type, WorkerMessageType.CompressedBatch);
      let compressedBatchMessage = message as ICompressedBatchMessage;
      let payload = JSON.parse(compressedBatchMessage.rawData);
      assert.equal(payload.events.length, 2);
      assert.equal(payload.events[0].type, firstMockEventName);
      assert.equal(payload.events[1].type, secondMockEventName);
      done();
    };
  });

  it("validates that events are batched for upload correctly when total length is above the limit", (done: DoneFn) => {
    let worker = createTestWorker();
    let firstMockEventName = "FirstMockEvent";
    let secondMockEventName = "SecondMockEvent";
    let firstMockEvent = getMockEvent(firstMockEventName);
    let secondMockEvent = getMockEvent(secondMockEventName);
    let firstMockData = Array(Math.round(config.batchLimit * (2 / 3))).join("1");
    let secondMockData = Array(Math.round(config.batchLimit / 2)).join("2");
    firstMockEvent.state = { data: firstMockData };
    secondMockEvent.state = { data: secondMockData };
    let addEventMessage = createAddEventMessage(firstMockEvent);
    let forceCompressionMsg = createForceCompressionMessage();

    worker.postMessage(addEventMessage);
    addEventMessage.event = secondMockEvent;
    worker.postMessage(addEventMessage);
    worker.postMessage(forceCompressionMsg);
    scheduleTestFailureTimeout(done, "Worker has not responded in allocated time");

    let handlerInvocationCount = 0;
    let payloads: any[] = [];
    processMessage = (message: IWorkerMessage) => {
      let compressedBatchMessage = message as ICompressedBatchMessage;
      let payload = JSON.parse(compressedBatchMessage.rawData);
      payloads.push(payload);
      handlerInvocationCount++;
      if (handlerInvocationCount > 1) {
        performAssertions();
      }
    };

    function performAssertions() {
      assert.equal(payloads.length, 2);
      assert.equal(payloads[0].events.length, 1);
      assert.equal(payloads[0].events[0].type, firstMockEventName);
      assert.equal(payloads[1].events.length, 1);
      assert.equal(payloads[1].events[0].type, secondMockEventName);
      done();
    }
  });

  it("validates that single event is sent when its own length is above the limit", (done: DoneFn) => {
    let worker = createTestWorker();
    let mockEvent = getMockEvent();
    let mockEventData = Array(Math.round(config.batchLimit + 1)).join("1");
    mockEvent.state = { data: mockEventData };
    let addEventMessage = createAddEventMessage(mockEvent);

    worker.postMessage(addEventMessage);
    scheduleTestFailureTimeout(done, "Worker has not responded in allocated time");

    processMessage = (message: IWorkerMessage) => {
      assert.equal(message.type, WorkerMessageType.CompressedBatch);
      let compressedBatchMessage = message as ICompressedBatchMessage;
      let payload = JSON.parse(compressedBatchMessage.rawData);
      assert.equal(payload.events.length, 1);
      assert.equal(payload.events[0].type, MockEventName);
      done();
    };
  });

  it("validates that payloads consisting of a single XHR error event are not uploaded", (done: DoneFn) => {
    let worker = createTestWorker();
    let mockXhrErrorEvent = getMockEvent(InstrumentationEventName);
    let mockXhrErrorEventState = {
      type: Instrumentation.XhrError
    } as IXhrErrorEventState;
    mockXhrErrorEvent.state = mockXhrErrorEventState;
    let addEventMessage: IAddEventMessage = {
      type: WorkerMessageType.AddEvent,
      time: -1,
      event: mockXhrErrorEvent
    };
    let forceCompressionMsg = createForceCompressionMessage();

    worker.postMessage(addEventMessage);
    worker.postMessage(forceCompressionMsg);
    scheduleTestSuccessTimeout(done);

    processMessage = (message: IWorkerMessage) => {
      // This handler should NOT be invoked, so explicitly failing test in this path
      done.fail("Received batch consisting of a single XHR event");
    };
  });

  function onWorkerMessage(evt: MessageEvent) {
    let message = evt.data;
    workerMessages.push(message);
    processMessage(message);
  }

  function createTestWorker() {
    let worker = createCompressionWorker(getMockEnvelope(), onWorkerMessage);
    (worker as any).isTestWorker = true;
    return worker;
  }

  function scheduleTestSuccessTimeout(done: DoneFn) {
    jasmine.clock().uninstall();
    testFailureTimeout = setTimeout(() => {
      done();
    }, WorkerMessageWaitTime);
    jasmine.clock().install();
  }

  function scheduleTestFailureTimeout(done: DoneFn, failureMessage: string) {
    jasmine.clock().uninstall();
    testFailureTimeout = setTimeout(() => {
      done.fail(failureMessage);
    }, WorkerMessageWaitTime);
    jasmine.clock().install();
  }

  function createAddEventMessage(event: IEvent): IAddEventMessage {
    let addEventMessage: IAddEventMessage = {
      type: WorkerMessageType.AddEvent,
      time: -1,
      event
    };
    return addEventMessage;
  }

  function createForceCompressionMessage(): ITimestampedWorkerMessage {
    let forceCompressionMessage: ITimestampedWorkerMessage = {
      type: WorkerMessageType.ForceCompression,
      time: -1
    };
    return forceCompressionMessage;
  }
});
