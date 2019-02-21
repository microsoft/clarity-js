import schemas from "@src/converters/schema";

import { IAddEventMessage, ITimestampedWorkerMessage, WorkerMessageType } from "@clarity-types/compressionworker";
import { IEvent } from "@clarity-types/core";
import { Instrumentation, IXhrErrorEventState } from "@clarity-types/instrumentation";
import { createMockEnvelope, createMockEvent, MockEventName } from "@karma/setup/mocks/event";
import { installWorkerProxy, uninstallWorkerProxy } from "@karma/setup/proxyapis/worker";
import { PubSubEvents, unsubscribeAll, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { resetWatcher, stopWatching, watch } from "@karma/setup/watch";
import { createCompressionWorker } from "@src/compressionworker";
import { encode } from "@src/converters/convert";
import { assert } from "chai";

// TODO: Remove src imports and modify compression worker to accept batchLimit as an argument
import { config } from "@src/config";

const InstrumentationEventName = "Instrumentation";
const WorkerMessageWaitTime = 1000;

xdescribe("Compression Worker Tests", () => {
    let worker: Worker = null;

    beforeEach(() => {
        resetWatcher();
        installWorkerProxy();
        schemas.reset();
        worker = createTestWorker();
    });
    afterEach(() => {
        worker.terminate();
        unsubscribeAll();
        uninstallWorkerProxy();
    });

    it("validates that events are batched for upload correctly when total length is below the limit",
        testAsync(async (done: DoneFn) => {
            watch();
            let firstMockEventName = "FirstMockEvent";
            let firstMockEvent = createMockEvent(firstMockEventName);
            let addEventMessage = createAddEventMessage(firstMockEvent);
            worker.postMessage(addEventMessage);

            let secondMockEventName = "SecondMockEvent";
            let secondMockEvent = createMockEvent(secondMockEventName);
            addEventMessage.event = encode(secondMockEvent);
            worker.postMessage(addEventMessage);

            let forceCompressionMsg = createForceCompressionMessage();
            worker.postMessage(forceCompressionMsg);
            await waitFor(PubSubEvents.WORKER_COMPRESSED_BATCH_MESSAGE);

            const compressedEvents = stopWatching().compressedEvents;
            assert.equal(compressedEvents.length, 2);
            assert.equal(compressedEvents[0].type, firstMockEventName);
            assert.equal(compressedEvents[1].type, secondMockEventName);
            done();

        })
    );

    it("validates that events are batched for upload correctly when total length is above the limit",
        testAsync(async (done: DoneFn) => {
            watch();
            let firstMockEventName = "FirstMockEvent";
            let firstMockEvent = createMockEvent(firstMockEventName);
            let firstMockData = Array(Math.round(config.batchLimit * (2 / 3))).join("1");
            firstMockEvent.state = { data: firstMockData };
            let addEventMessage = createAddEventMessage(firstMockEvent);
            worker.postMessage(addEventMessage);

            let secondMockEventName = "SecondMockEvent";
            let secondMockEvent = createMockEvent(secondMockEventName);
            let secondMockData = Array(Math.round(config.batchLimit / 2)).join("2");
            secondMockEvent.state = { data: secondMockData };
            addEventMessage.event = encode(secondMockEvent);
            worker.postMessage(addEventMessage);

            let forceCompressionMsg = createForceCompressionMessage();
            worker.postMessage(forceCompressionMsg);
            await waitFor(PubSubEvents.WORKER_COMPRESSED_BATCH_MESSAGE);

            const firstBatchEvents = stopWatching().compressedEvents;
            watch();
            await waitFor(PubSubEvents.WORKER_COMPRESSED_BATCH_MESSAGE);

            const secondBatchEvents = stopWatching().compressedEvents;
            assert.equal(firstBatchEvents.length, 1);
            assert.equal(firstBatchEvents[0].type, firstMockEventName);
            assert.equal(secondBatchEvents.length, 1);
            assert.equal(secondBatchEvents[0].type, secondMockEventName);
            done();
        })
    );

    it("validates that single event is sent when its own length is above the limit", testAsync(async (done: DoneFn) => {
        watch();
        let mockEvent = createMockEvent();
        let mockEventData = Array(Math.round(config.batchLimit + 1)).join("1");
        mockEvent.state = { data: mockEventData };
        let addEventMessage = createAddEventMessage(mockEvent);
        worker.postMessage(addEventMessage);
        await waitFor(PubSubEvents.WORKER_COMPRESSED_BATCH_MESSAGE);
        const compressedEvents = stopWatching().compressedEvents;
        assert.equal(compressedEvents.length, 1);
        assert.equal(compressedEvents[0].type, MockEventName);
        done();
    }));

    it("validates that payloads consisting of a single XHR error event are not uploaded",
        testAsync(async (done: DoneFn) => {
            let mockXhrErrorEvent = createMockEvent(InstrumentationEventName);
            let mockXhrErrorEventState = {
                type: Instrumentation.XhrError
            } as IXhrErrorEventState;
            mockXhrErrorEvent.state = mockXhrErrorEventState;
            const addEventMessage = createAddEventMessage(mockXhrErrorEvent);
            // let addEventMessage: IAddEventMessage = {
            //     type: WorkerMessageType.AddEvent,
            //     time: -1,
            //     event: MockEventToArray(mockXhrErrorEvent),
            //     isXhrErrorEvent: true
            // };
            worker.postMessage(addEventMessage);

            let forceCompressionMsg = createForceCompressionMessage();
            worker.postMessage(forceCompressionMsg);
            const receivedCompressedBatch = await waitFor(PubSubEvents.UPLOAD, WorkerMessageWaitTime);

            receivedCompressedBatch
                ? done.fail("Received batch consisting of a single XHR event")
                : done();
        })
    );

    function createTestWorker(): Worker {
        return createCompressionWorker(createMockEnvelope(), () => {
            // ignore
        });
    }

    function createAddEventMessage(event: IEvent): IAddEventMessage {
        let addEventMessage: IAddEventMessage = {
            type: WorkerMessageType.AddEvent,
            time: -1,
            event: encode(event)
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
