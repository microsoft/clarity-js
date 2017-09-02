import { createCompressionWorker } from "./../src/compressionworker";
import { config } from "./../src/config";
import * as core from "./../src/core";
import { cleanupFixture, setupFixture } from "./testsetup";
import { getMockEnvelope, getMockEvent, MockEventName, observeEvents } from "./utils";

import * as chai from "chai";

type TestWorkerMessageHandler = (message: IWorkerMessage) => void;

const InstrumentationEventName = "Instrumentation";
let assert = chai.assert;

describe("Compression Worker Tests", () => {
  let workerMessages: IWorkerMessage[] = [];
  let messageHandlers: TestWorkerMessageHandler[] = [];
  let testFailureTimeout: number = null;

  beforeEach(() => {
    setupFixture([]);
    workerMessages = [];
    messageHandlers = [];
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
    let forceUploadMessage = createForceUploadMessage();

    messageHandlers.push(messageHandler);
    worker.postMessage(JSON.stringify(addEventMessage));
    addEventMessage.event = secondMockEvent;
    worker.postMessage(JSON.stringify(addEventMessage));
    worker.postMessage(JSON.stringify(forceUploadMessage));

    function messageHandler(message: IWorkerMessage) {
      assert.equal(message.type, WorkerMessageType.Upload);
      let uploadMessage = message as IUploadMessage;
      let payload = JSON.parse(uploadMessage.rawData);
      assert.equal(payload.events.length, 2);
      assert.equal(payload.events[0].type, firstMockEventName);
      assert.equal(payload.events[1].type, secondMockEventName);
      done();
    }
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
    let forceUploadMessage = createForceUploadMessage();

    messageHandlers.push(messageHandler);
    worker.postMessage(JSON.stringify(addEventMessage));
    addEventMessage.event = secondMockEvent;
    worker.postMessage(JSON.stringify(addEventMessage));
    worker.postMessage(JSON.stringify(forceUploadMessage));
    scheduleTestFailureTimeout();

    let handlerInvocationCount = 0;
    let payloads: any[] = [];
    function messageHandler(message: IWorkerMessage) {
      let uploadMessage = message as IUploadMessage;
      let payload = JSON.parse(uploadMessage.rawData);
      payloads.push(payload);
      handlerInvocationCount++;
      if (handlerInvocationCount > 1) {
        performAssertions();
      }
    }

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

    messageHandlers.push(messageHandler);
    worker.postMessage(JSON.stringify(addEventMessage));
    scheduleTestFailureTimeout();

    function messageHandler(message: IWorkerMessage) {
      assert.equal(message.type, WorkerMessageType.Upload);
      let uploadMessage = message as IUploadMessage;
      let payload = JSON.parse(uploadMessage.rawData);
      assert.equal(payload.events.length, 1);
      assert.equal(payload.events[0].type, MockEventName);
      done();
    }
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
      time: new Date().getTime(),
      event: mockXhrErrorEvent
    };
    let forceUploadMessage = createForceUploadMessage();

    messageHandlers.push(messageHandler);
    worker.postMessage(JSON.stringify(addEventMessage));
    worker.postMessage(JSON.stringify(forceUploadMessage));
    scheduleTestSuccessTimeout(done);

    function messageHandler(message: IWorkerMessage) {
      // This handler should NOT be invoked, so intentional assertion failure in this path
      assert.equal(true, false);
      done();
    }
  });

  function onWorkerMessage(evt: MessageEvent) {
    let message = JSON.parse(evt.data) as IWorkerMessage;
    workerMessages.push(message);
    for (let i = 0; i < messageHandlers.length; i++) {
      messageHandlers[i](message);
    }
  }

  function createTestWorker() {
    let worker = createCompressionWorker(getMockEnvelope(), onWorkerMessage);
    (worker as any).isTestWorker = true;
    return worker;
  }

  function endTestByTimeout(endWithSuccess: boolean, done?: DoneFn) {
    assert.equal(true, !!endWithSuccess);
    if (done) {
      done();
    }
  }

  function scheduleTestSuccessTimeout(done: DoneFn) {
    jasmine.clock().uninstall();
    testFailureTimeout = setTimeout(() => {
      endTestByTimeout(true, done);
    }, 1000);
    jasmine.clock().install();
  }

  function scheduleTestFailureTimeout() {
    jasmine.clock().uninstall();
    testFailureTimeout = setTimeout(() => {
      endTestByTimeout(false);
    }, 1000);
    jasmine.clock().install();
  }

  function createAddEventMessage(event: IEvent): IAddEventMessage {
    let addEventMessage: IAddEventMessage = {
      type: WorkerMessageType.AddEvent,
      time: new Date().getTime(),
      event
    };
    return addEventMessage;
  }

  function createForceUploadMessage(): ITimestampedWorkerMessage {
    let forceUploadMessage: ITimestampedWorkerMessage = {
      type: WorkerMessageType.ForceUpload,
      time: new Date().getTime()
    };
    return forceUploadMessage;
  }
});
