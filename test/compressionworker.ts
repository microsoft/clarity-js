import { createCompressionWorker } from "./../src/compressionworker";
import * as core from "./../src/core";
import { cleanupFixture, setupFixture } from "./testsetup";
import { getMockEnvelope, getMockEvent, MockEventName, observeEvents } from "./utils";

import * as chai from "chai";

type TestWorkerMessageHandler = (message: IWorkerMessage) => void;

let assert = chai.assert;

describe("Compression Worker Tests", () => {
  let workerMessages: IWorkerMessage[] = [];
  let messageHandlers: TestWorkerMessageHandler[] = [];

  beforeEach(() => {
    setupFixture([]);
    workerMessages = [];
    messageHandlers = [];
  });
  afterEach(cleanupFixture);

  // it("validates that events are batched for upload correctly when total length is below the limit", (done) => {
  //   let eventName = "CoreByteLimitTest";
  //   let bytesLengthBefore = getAllSentBytes().length;
  //   let expectedBytesLength = bytesLengthBefore + 1;
  //   let eventOneData = Array(Math.round(limit * (1 / 3))).join("1");
  //   let eventTwoData = Array(Math.round(limit * (1 / 3))).join("2");

  //   core.addEvent({
  //     type: eventName,
  //     state: { data: eventOneData }
  //   });
  //   core.addEvent({
  //     type: eventName,
  //     state: { data: eventTwoData }
  //   });
  //   waitForNewBytes(performAssertions);

  //   function performAssertions() {
  //     assert.equal(getAllSentBytes().length, expectedBytesLength);
  //     done();
  //   }
  // });

  // it("validates that events are batched for upload correctly when total length is above the limit", (done) => {
  //   triggerSend();
  //   let eventName = "CoreByteLimitTest";
  //   let bytesLengthBefore = getAllSentBytes().length;
  //   let expectedBytesLength = bytesLengthBefore + 2;

  //   let eventOneData = Array(Math.round(limit * (2 / 3))).join("1");
  //   let eventTwoData = Array(Math.round(limit / 2)).join("2");

  //   core.addEvent({
  //     type: eventName,
  //     state: { data: eventOneData }
  //   });
  //   core.addEvent({
  //     type: eventName,
  //     state: { data: eventTwoData }
  //   });
  //   waitForNewBytes(performAssertions);

  //   function performAssertions() {
  //     assert.equal(getAllSentBytes().length, expectedBytesLength);
  //     done();
  //   }
  // });

  // it("validates that single event is sent when its own length is above the limit", (done) => {
  //   let eventName = "CoreByteLimitTest";
  //   let bytesLengthBefore = getAllSentBytes().length;
  //   let expectedBytesLength = bytesLengthBefore + 1;
  //   let eventData = Array(Math.round(limit + 1)).join("1");
  //   core.addEvent({
  //     type: eventName,
  //     state: { data: eventData }
  //   });
  //   waitForNewBytes(performAssertions);

  //   function performAssertions() {
  //     assert.equal(getAllSentBytes().length, expectedBytesLength);
  //     done();
  //   }
  // });

  it("validates that queued payload is sent on terminate", (done) => {
    let worker = createTestWorker();
    let mockEvent = getMockEvent();
    let addEventMessage: IAddEventMessage = {
      type: WorkerMessageType.AddEvent,
      event: mockEvent,
      time: new Date().getTime(),
    };
    let terminateMsg: ITimestampedWorkerMessage = {
      type: WorkerMessageType.Terminate,
      time: new Date().getTime()
    };

    assert.equal(workerMessages.length, 0);
    messageHandlers.push(messageHandler);
    worker.postMessage(JSON.stringify(addEventMessage));
    worker.postMessage(JSON.stringify(terminateMsg));

    function messageHandler(message: IWorkerMessage) {
      assert.equal(message.type, WorkerMessageType.Upload);
      let uploadMessage = message as IUploadMessage;
      let payload = JSON.parse(uploadMessage.rawData);
      assert.equal(payload.events.length, 1);
      assert.equal(payload.events[0].type, MockEventName);
      done();
    }
  });

  // it("validates that re-send cycle doesn't enter an infinite loop when all requests fail", (done) => {
  //   let uploadInvocationCount = 0;

  //   // Mock fail all requests (e.g. dropped internet connection)
  //   config.uploadHandler = (payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback) => {
  //     onFailure(400);
  //     uploadInvocationCount++;
  //   };
  //   triggerMockEvent();
  //   triggerSend();

  //   let settledUploadInvocationCount = uploadInvocationCount;
  //   // Ensure that no new events are generated through 'try to report failure --> fail to deliver --> try to report failure' cycle
  //   for (let i = 0; i < 5; i++) {
  //     triggerSend();
  //     assert.equal(uploadInvocationCount, settledUploadInvocationCount);
  //   }

  //   done();
  // });

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
});
