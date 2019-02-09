// @ts-ignore: 'merge' implicityly has 'any' type. There are no typings for 'merge'
import * as merge from "merge";

import { UploadCallback } from "@clarity-types/core";
import { ClarityJs, IConfig } from "@clarity-types/index";
import { setRealTimeout } from "./proxyapis/jasmineclock";
import { publishAsync, publishSync, PubSubEvents, waitFor } from "./pubsub";
import { getFullImpressionWatchResult, resetWatcher } from "./watch";

export interface IStartClarityOptions {
    flushInitialActivity: boolean;
}

declare var clarity: typeof ClarityJs;

const uploadDelay: number = 500;
const defaultStartOptions: IStartClarityOptions = {
    flushInitialActivity: true
};

let activeConfig: Partial<IConfig> = null;

export async function startClarity(_config?: Partial<IConfig>, _startOptions?: IStartClarityOptions): Promise<void> {
    const testConfig: IConfig = merge(true, _config);
    testConfig.delay = uploadDelay;

    const _uploadHandler = testConfig.uploadHandler;
    testConfig.uploadHandler = (payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback): void => {
        testUploadHandler(payload, onSuccess, onFailure);
        if (_uploadHandler) {
            _uploadHandler(payload, onSuccess, onFailure);
        }
    };

    resetWatcher();
    activeConfig = testConfig;
    clarity.start(testConfig);

    const startOptions = merge(true, defaultStartOptions, _startOptions);
    if (startOptions.flushInitialActivity) {
        await flushInitialActivity();
    }
}

export function stopClarity(): void {
    clarity.stop();
}

export async function restartClarity(
    _config?: Partial<IConfig>,
    _startOptions?: IStartClarityOptions,
    beforeStart?: () => void
): Promise<void> {
    stopClarity();
    if (beforeStart) {
        beforeStart();
    }
    await startClarity(_config, _startOptions);
}

export function triggerClarity(key?: string): void {
    clarity.trigger(key || "testtrigger");
}

export async function triggerClarityAndWaitForUpload(): Promise<void> {
    return new Promise((resolve: any, reject: any): void => {
        waitFor(PubSubEvents.UPLOAD).then(() => resolve());
        triggerClarity();
    });
}

export function triggerMutationEvent(attrs?: { [key: string]: string }): HTMLElement {
    const triggerElement = document.createElement("eventtrigger");
    if (attrs) {
        const attrNames = Object.keys(attrs);
        for (const name of attrNames) {
            const val = attrs[name];
            triggerElement.setAttribute(name, val);
        }
    }
    document.body.appendChild(triggerElement);
    return triggerElement;
}

export async function triggerMutationEventAndWaitForUpload(
    attrs?: { [key: string]: string }
): Promise<HTMLElement> {
    return new Promise((resolve: any, reject: any): void => {
        const triggerElem = triggerMutationEvent(attrs);
        waitFor(PubSubEvents.MUTATION).then(() => {
            waitFor(PubSubEvents.UPLOAD).then(() => resolve(triggerElem));
            jasmine.clock().tick(activeConfig.delay);
        });
    });
}

export function getActiveConfig(): Partial<IConfig> {
    return activeConfig;
}

export function getVersion(): string {
    return clarity.version;
}

function testUploadHandler(payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback): void {
    publishSync(PubSubEvents.SYNC_AFTER_UPLOAD, payload);
    publishAsync(PubSubEvents.UPLOAD, payload);
}

async function flushInitialActivity(): Promise<void> {
    return new Promise((resolve: any, reject: any): void => {
        function tryResolve(): void {
            hasActivity()
                .then((active: boolean) => {
                    if (active) {
                        jasmine.clock().tick(100000);
                        const nextActivityIndicator = (
                            activeConfig.backgroundMode
                            ? PubSubEvents.WORKER_COMPRESSED_BATCH_MESSAGE
                            : PubSubEvents.UPLOAD
                        );
                        waitFor(nextActivityIndicator).then(tryResolve);
                    } else {
                        resolve();
                    }
                });
        }
        tryResolve();
    });
}

async function hasActivity(): Promise<boolean> {
    return new Promise((resolve: any, reject: any): void => {
        const allWatch = getFullImpressionWatchResult();
        const processedEvents = activeConfig.backgroundMode ? allWatch.compressedEvents : allWatch.sentEvents;
        if (allWatch.coreEvents.length === processedEvents.length) {
            // Trigger any timeout'ed activity in Clarity and then set a real timeout to give our
            // async PubSub notifications a chance to report any activity if it happened
            jasmine.clock().tick(100000);
            setRealTimeout(() => {
                const refreshAllWatch = getFullImpressionWatchResult();
                resolve(!(refreshAllWatch.coreEvents.length === allWatch.coreEvents.length));
            }, 0);
        } else {
            resolve(true);
        }
    });
}
