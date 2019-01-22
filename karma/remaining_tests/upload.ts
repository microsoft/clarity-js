import { config } from "../../src/config";
import * as core from "../../src/core";
import { getEventType } from "../../src/utils";
import { Instrumentation, State, UploadCallback } from "../../types/index";
import { activateCore, cleanupFixture, setupFixture } from "../setup/testsetup";
import {
  getMockEnvelope, getMockEvent, observeEvents, postCompressedBatch
} from "../setup/utils";
import uncompress from "./uncompress";

import * as chai from "chai";
let assert = chai.assert;

describe("Data Upload Tests", () => {

  beforeEach(() => {
    setupFixture([]);
  });
  afterEach(cleanupFixture);

  it("validates that custom upload handler is invoked when passed through config", (done: DoneFn) => {
    let sendCount = 0;
    config.uploadHandler = (payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) => {
      sendCount++;
    };

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
    assert.equal(events[0].type, core.InstrumentationEventName);
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
    assert.equal(events[0].type, core.InstrumentationEventName);
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
    assert.equal(getEventType(firstPayload.events[0]), firstMockEventName);

    // Verify second payload
    assert.equal(secondPayload.envelope.sequenceNumber, 1);
    assert.equal(secondPayload.events.length, 1);
    assert.equal(getEventType(secondPayload.events[0]), secondMockEventName);

    // Verify third payload
    assert.equal(thirdPayload.envelope.sequenceNumber, 0);
    assert.equal(thirdPayload.events.length, 1);
    assert.equal(getEventType(thirdPayload.events[0]), firstMockEventName);

    done();
  });

  it("validates that Clarity tears down and logs instrumentation when total byte limit is exceeded", (done: DoneFn) => {
    core.teardown();
    config.uploadHandler = (payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) => { onSuccess(200); };
    activateCore();

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

});
