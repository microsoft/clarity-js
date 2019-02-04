import * as PubSub from "pubsub-js";

import { clearRealTimeout, setRealTimeout } from "./proxyapis/jasmineclock";

const _publishSync = PubSub.publishSync;

// Development option per package documentation:
// https://www.npmjs.com/package/pubsub-js
(PubSub as any).immediateExceptions = true;

// Our tests are instrumented with Jasmine clock, which means that async publish wouldn't trigger until we manually
// move the clock forward. However, jasmine clock tick is synchronous, so then publish would work as publishSync.
// One should use an explicit publishAsync utility function provided below to achieve true async behavior.
(PubSub as any).publish = () => {
    throw new Error("Direct use of PubSub 'publish' is disallowed.");
};

// Synchronous publishing can get out of control very easily and result in some complicated bugs - avoid using it
// If it is absolutely required, use an explicity publishSync utility function provided below.
(PubSub as any).publishSync = () => {
    throw new Error("Direct use of PubSub 'publishSync' is disallowed.");
};

export enum PubSubEvents {

    // Page ====> Worker messages
    WORKER_ADD_EVENT_MESSAGE,
    WORKER_FORCE_COMPRESSION_MESSAGE,
    SYNC_AFTER_WORKER_ADD_EVENT_MESSAGE,

    // Page <==== Worker messages
    WORKER_COMPRESSED_BATCH_MESSAGE,
    SYNC_AFTER_WORKER_COMPRESSED_BATCH_MESSAGE,

    // End output monitoring
    UPLOAD,
    SYNC_AFTER_UPLOAD,

    // Browser callbacks
    MUTATION,
    CLICK,
    SCROLL,
    INPUT,
    CHANGE,
    UNKNOWN
}

const timeouts: { [key: string]: number } = {};

// WARNING: Be careful with this and use only when absolutely required!
// PubSub docs say "USE WITH CAUTION, HERE BE DRAGONS!!!". I saw them - they are marvelous, but terrifying creatures.
// If you still end up using it, try to keep your sync subscribers as dumb as possible to perform some
// simple task and return immediately without calling other functions (ideally).
export function publishSync(message: any, data: any): void {
    _publishSync.apply(PubSub, [message, data]);
}

export function publishAsync(message: any, data: any): void {
    const timeoutId = setRealTimeout(() => {
        delete timeouts[timeoutId];
        _publishSync.apply(PubSub, [message, data]);
    }, 0);
    timeouts[timeoutId] = timeoutId;
}

export function unsubscribeAll() {
    PubSub.clearAllSubscriptions();
}

export function revokeAllMessages() {
    const timeoutIds = Object.keys(timeouts);
    for (const timeoutIdStr of timeoutIds) {
        const timeoutId = timeouts[timeoutIdStr];
        clearRealTimeout(timeoutId);
        delete timeouts[timeoutIdStr];
    }
}

export async function waitFor(message: any, abandonAfterMs?: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        function onMessage() {
            PubSub.unsubscribe(subToken);
            clearRealTimeout(abandonTimeout);
            resolve(true);
        }
        function onTimeout() {
            PubSub.unsubscribe(subToken);
            resolve(false);
        }
        let abandonTimeout: number = null;
        const subToken = PubSub.subscribe(message, onMessage);
        if (abandonAfterMs !== undefined) {
            abandonTimeout = setRealTimeout(onTimeout, abandonAfterMs);
        }
    });
}

// Yielding thread allows subscribers receive and process async messages
export async function yieldThread(): Promise<void> {
    return new Promise((resolve, reject) => {
        setRealTimeout(resolve, 0);
    });
}
