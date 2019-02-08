import { IAddEventMessage, ICompressedBatchMessage, IWorkerMessage, WorkerMessageType } from "@clarity-types/compressionworker";
import { publishAsync, publishSync, PubSubEvents } from "@karma/setup/pubsub";
import { setRealTimeout } from "./jasmineclock";

interface IWorkerProxy extends Worker {
    _postMessage: typeof Worker.prototype.postMessage;
    _onmessage: typeof Worker.prototype.onmessage;
}

let _Worker: typeof Worker = null;

export const installWorkerProxy = () => {
    if (_Worker === null) {
        _Worker = Worker;
    }
    Worker = (function(aURL: string, options: WorkerOptions, ig: string): Worker {
        const instance: IWorkerProxy = new _Worker(aURL, options) as IWorkerProxy;
        instance._postMessage = instance.postMessage;
        instance.postMessage = (msg: IWorkerMessage) => {
            instance._postMessage(msg);
            processWorkerMessage(msg);
        };

        // In Clarity code Worker's 'ongmessage' handler is assigned synchronously immediately after its instantiation
        // This means that at this time we don't have access to it and we need to come back and proxy it once its set.
        // NOTE: This won't handle more complex scenarios where 'onmessage' might be set or changed asynchronously at
        // some point in the future, however it's not something that's relevant to our use case right now. When/if such
        // complexity comes along, we can use object mutation detection libraries to wrap updated handlers as well.
        setRealTimeout(() => {
            instance._onmessage = instance.onmessage;
            instance.onmessage = (msgEvt: MessageEvent) => {
                instance._onmessage(msgEvt);
                processWorkerMessage(msgEvt.data);
            };
        }, 0);

        return instance;
    }) as any as typeof Worker;
};

export const uninstallWorkerProxy = () => {
    if (_Worker !== null) {
        Worker = _Worker;
        _Worker = null;
    }
};

function processWorkerMessage(message: IWorkerMessage): void {
    switch (message.type) {

        // Page ===> Worker
        case WorkerMessageType.AddEvent:
            let addEventMsg = message as IAddEventMessage;
            publishSync(PubSubEvents.SYNC_AFTER_WORKER_ADD_EVENT_MESSAGE, addEventMsg);
            publishAsync(PubSubEvents.WORKER_ADD_EVENT_MESSAGE, addEventMsg);
            break;
        case WorkerMessageType.ForceCompression:
            publishAsync(PubSubEvents.WORKER_FORCE_COMPRESSION_MESSAGE, message);
            break;

        // Page <=== Worker
        case WorkerMessageType.CompressedBatch:
            let uploadMsg = message as ICompressedBatchMessage;
            publishSync(PubSubEvents.SYNC_AFTER_WORKER_COMPRESSED_BATCH_MESSAGE, message);
            publishAsync(PubSubEvents.WORKER_COMPRESSED_BATCH_MESSAGE, uploadMsg);
            break;
        default:
            break;
    }
}
