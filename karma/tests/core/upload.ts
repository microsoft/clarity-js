import { UploadCallback } from "@clarity-types/core";
import { Instrumentation } from "@clarity-types/instrumentation";
import { Action } from "@clarity-types/layout";
import { getActiveConfig, restartClarity, triggerMutationEvent, triggerMutationEventAndWaitForUpload } from "@karma/setup/clarity";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { PubSubEvents, waitFor } from "@karma/setup/pubsub";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

const InstrumentationEventName = "Instrumentation";
const LayoutEventName = "Layout";

xdescribe("Data Upload Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("validates that custom upload handler is invoked when passed through config", testAsync(async (done: DoneFn) => {
        let customerUploadHandlerInvoked: boolean = false;
        function customUploadHandler(payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback): void {
            customerUploadHandlerInvoked = true;
        }
        await restartClarity({ uploadHandler: customUploadHandler });

        assert.equal(customerUploadHandlerInvoked, true);
        done();
    }));

    it("validates that XhrError is logged for failed requests through the 'onFailure' upload callback",
        testAsync(async (done: DoneFn) => {
            let shouldMockFailure: boolean = false;
            function customUploadHandler(payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback): void {
                if (shouldMockFailure) {
                    // Suppose XHR was opened and returned a 400 code
                    onFailure(400);
                }
            }
            await restartClarity({
                instrument: true,
                uploadHandler: customUploadHandler
            });

            shouldMockFailure = true;

            // Trigger event and wait for it to be processed by core, so that it doesn't pollute our watch
            triggerMutationEvent();
            await waitFor(PubSubEvents.MUTATION);

            watch();
            jasmine.clock().tick(getActiveConfig().delay);
            await waitFor(PubSubEvents.UPLOAD);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 1);
            assert.equal(events[0].type, InstrumentationEventName);
            assert.equal(events[0].state.type, Instrumentation.XhrError);
            assert.equal(events[0].state.requestStatus, 400);
            done();
        })
    );

    it("validates that Clarity tears down and logs instrumentation when total byte limit is exceeded",
        testAsync(async (done: DoneFn) => {
            let shouldMockSuccess: boolean = false;
            function customUploadHandler(payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback): void {
                if (shouldMockSuccess) {
                    // Internal onSuccess callback is where clarity increments uploaded bytes and matches it against the configured limit
                    onSuccess(200);
                }
            }
            await restartClarity({
                instrument: true,
                totalLimit: 0,
                uploadHandler: customUploadHandler
            });

            shouldMockSuccess = true;

            // Trigger event and wait for it to be processed by core, so that it doesn't pollute our watch
            triggerMutationEvent();
            await waitFor(PubSubEvents.MUTATION);

            watch();
            jasmine.clock().tick(getActiveConfig().delay);
            await waitFor(PubSubEvents.UPLOAD);

            const events = stopWatching().coreEvents;
            assert.equal(events.length, 2);
            assert.equal(events[0].state.type, Instrumentation.TotalByteLimitExceeded);
            assert.equal(events[1].state.type, Instrumentation.Teardown);
            done();
        })
    );

    it("validates that dropped payloads are re-sent through the next request's 'onSuccess' callback",
        testAsync(async (done: DoneFn) => {
            const triggerKeyAttrName: string = "data-trigger-key";
            let shouldMockSuccess: boolean = false;
            let shouldMockFailure: boolean = false;
            function customUploadHandler(payload: string, onSuccess: UploadCallback, onFailure?: UploadCallback): void {
                if (shouldMockSuccess) {
                    // Internal onSuccess callback is where clarity increments uploaded bytes and matches it against the configured limit
                    onSuccess(200);
                }
                if (shouldMockFailure) {
                    // Suppose XHR was opened and returned a 400 code
                    onFailure(400);
                }
            }
            await restartClarity({
                instrument: true,
                uploadHandler: customUploadHandler
            });

            // Part 1: Mock an XHR failure, so that trigger event 1 is stored for re-delivery and XHR failure instrumentation is logged
            shouldMockFailure = true;
            const firstTriggerAttrs = {};
            firstTriggerAttrs[triggerKeyAttrName] = "1";
            const firstTrigger = await triggerMutationEventAndWaitForUpload(firstTriggerAttrs);

            // Part 2: Successfully send second payload, which should trigger re-send of the first payload
            shouldMockFailure = false;
            shouldMockSuccess = true;
            watch();
            const secondTriggerAttrs = {};
            secondTriggerAttrs[triggerKeyAttrName] = "2";
            const secondTrigger = await triggerMutationEventAndWaitForUpload(secondTriggerAttrs);

            // We expect to have 3 events:
            // 1. XHR error: this event got generated immediately after trigger event 1 upload failed
            // 2. Trigger event 2: Our manually-crafted second trigger, after which we waited for upload (#1 + #2 event batch)
            // 3. Trigger event 1: Upload from the line above, synchronously triggers a re-upload of event trigger 1
            const sentEvents = stopWatching().sentEvents;
            assert.equal(sentEvents.length, 3);
            assert.equal(sentEvents[0].type, InstrumentationEventName);
            assert.equal(sentEvents[0].state.type, Instrumentation.XhrError);
            assert.equal(sentEvents[0].state.requestStatus, 400);
            assert.equal(sentEvents[1].type, LayoutEventName);
            assert.equal(sentEvents[1].state.action, Action.Insert);
            assert.equal(sentEvents[1].state.attributes[triggerKeyAttrName], secondTrigger.attributes[triggerKeyAttrName].value);
            assert.equal(sentEvents[2].type, LayoutEventName);
            assert.equal(sentEvents[2].state.action, Action.Insert);
            assert.equal(sentEvents[2].state.attributes[triggerKeyAttrName], firstTrigger.attributes[triggerKeyAttrName].value);
            done();
        })
    );

});
