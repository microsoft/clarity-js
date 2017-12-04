import { IAddEventMessage, ICompressedBatchMessage, IEvent, Instrumentation,
  ITimestampedWorkerMessage, IWorkerMessage, IXhrErrorEventState, WorkerMessageType } from "../clarity";
import { createCompressionWorker } from "./../src/compressionworker";
import { config } from "./../src/config";
import * as core from "./../src/core";
import { mockDataToArray } from "./convert";
import { cleanupFixture, setupFixture } from "./testsetup";
import { getMockEnvelope, getMockEvent, getMockMetadata, MockEventName, observeEvents, payloadToEvents } from "./utils";

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
    let firstMockData = "FirstMockEvent";
    let secondMockData = "SecondMockEvent";
    let firstMockEvent = getMockEvent(firstMockData);
    let secondMockEvent = getMockEvent(secondMockData);
    let addEventMessage = createAddEventMessage(firstMockEvent);
    let forceCompressionMsg = createForceCompressionMessage();

    worker.postMessage(addEventMessage);
    addEventMessage.event = EventToArrayConverter(secondMockEvent);
    worker.postMessage(addEventMessage);
    worker.postMessage(forceCompressionMsg);

    processMessage = (message: IWorkerMessage) => {
      assert.equal(message.type, WorkerMessageType.CompressedBatch);
      let compressedBatchMessage = message as ICompressedBatchMessage;
      let payload = JSON.parse(compressedBatchMessage.rawData);
      let events = payloadToEvents(payload);
      assert.equal(events.length, 2);
      assert.equal(events[0].data, firstMockData);
      assert.equal(events[1].data, secondMockData);
      done();
    };
  });

  it("validates that events are batched for upload correctly when total length is above the limit", (done: DoneFn) => {
    let worker = createTestWorker();
    let firstMockEventData = Array(Math.round(config.batchLimit * (2 / 3))).join("1");
    let secondMockEventData = Array(Math.round(config.batchLimit / 2)).join("2");
    let firstMockEvent = getMockEvent(firstMockEventData);
    let secondMockEvent = getMockEvent(secondMockEventData);
    let addEventMessage = createAddEventMessage(firstMockEvent);
    let forceCompressionMsg = createForceCompressionMessage();

    worker.postMessage(addEventMessage);
    addEventMessage.event = EventToArrayConverter(secondMockEvent);
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
      let firstPayloadEvents = payloadToEvents(payloads[0]);
      let secondPayloadEvents = payloadToEvents(payloads[1]);
      assert.equal(firstPayloadEvents.length, 1);
      assert.equal(firstPayloadEvents[0].data, firstMockEventData);
      assert.equal(secondPayloadEvents.length, 1);
      assert.equal(secondPayloadEvents[0].data, secondMockEventData);
      done();
    }
  });

  it("validates that single event is sent when its own length is above the limit", (done: DoneFn) => {
    let worker = createTestWorker();
    let mockEvent = getMockEvent();
    let mockEventData = Array(Math.round(config.batchLimit + 1)).join("1");
    mockEvent.data = { data: mockEventData };
    let addEventMessage = createAddEventMessage(mockEvent);

    worker.postMessage(addEventMessage);
    scheduleTestFailureTimeout(done, "Worker has not responded in allocated time");

    processMessage = (message: IWorkerMessage) => {
      assert.equal(message.type, WorkerMessageType.CompressedBatch);
      let compressedBatchMessage = message as ICompressedBatchMessage;
      let payload = JSON.parse(compressedBatchMessage.rawData);
      let events = payloadToEvents(payload);
      assert.equal(events.length, 1);
      assert.equal(events[0].type, MockEventName);
      done();
    };
  });

  it("validates that payloads consisting of a single XHR error event are not uploaded", (done: DoneFn) => {
    let worker = createTestWorker();
    let mockXhrErrorEvent = getMockEvent();
    let mockXhrErrorEventState = {
      type: Instrumentation.XhrError
    } as IXhrErrorEventData;
    mockXhrErrorEvent.type = InstrumentationEventName;
    mockXhrErrorEvent.data = mockXhrErrorEventState;
    mockXhrErrorEvent.converter = xhrErrorToArray;
    let addEventMessage: IAddEventMessage = {
      type: WorkerMessageType.AddEvent,
      time: -1,
      event: EventToArrayConverter(mockXhrErrorEvent)
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

  function createTestWorker(): Worker {
    let worker = createCompressionWorker(getMockMetadata(), onWorkerMessage);
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
      event: EventToArrayConverter(event)
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
