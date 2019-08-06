import uncompress from "./uncompress";

import { IAddEventMessage, ICompressedBatchMessage } from "@clarity-types/compressionworker";
import { IEnvelope, IEvent, IEventArray, IPayload } from "@clarity-types/core";
import { decode } from "@src/converters/convert";
import { SchemaManager } from "@src/converters/schema";
import { PubSubEvents } from "./pubsub";

interface IWatchResult {
    coreEvents: IEvent[];
    compressedEvents: IEvent[];
    sentEvents: IEvent[];
    sentEnvelopes: IEnvelope[];
}

let schemas: SchemaManager = new SchemaManager();
let watchResult: IWatchResult = null;
let fullImpression: IWatchResult = null;
let addEventMessageSub: any = null;
let compressedBatchSub: any = null;
let uploadSub: any = null;
let watching: boolean = false;

export function watch(): any {
    if (watching) {
        throw new Error("Already watching");
    } else {
        watchResult = {
            coreEvents: [],
            compressedEvents: [],
            sentEvents: [],
            sentEnvelopes: []
        };
        watching = true;
    }
}

export function stopWatching(): IWatchResult {
    watching = false;
    return watchResult;
}

export function getFullImpressionWatchResult(): IWatchResult {
    return JSON.parse(JSON.stringify(fullImpression));
}

export function resetWatcher(): void {
    fullImpression = {
        coreEvents: [],
        compressedEvents: [],
        sentEvents: [],
        sentEnvelopes: []
    };
    schemas.reset();

    // Resubscribe to all relevant topics
    PubSub.unsubscribe(addEventMessageSub);
    PubSub.unsubscribe(compressedBatchSub);
    PubSub.unsubscribe(uploadSub);

    addEventMessageSub = PubSub.subscribe(PubSubEvents.SYNC_AFTER_WORKER_ADD_EVENT_MESSAGE, onAddEventMessage);
    compressedBatchSub = PubSub.subscribe(PubSubEvents.SYNC_AFTER_WORKER_COMPRESSED_BATCH_MESSAGE, onCompressedBatch);
    uploadSub = PubSub.subscribe(PubSubEvents.SYNC_AFTER_UPLOAD, onUpload);
}

export function onAddEventMessage(pubSubMessage: any, workerMessage: IAddEventMessage): void {
    const decodedEvent: IEvent = decode(workerMessage.event, schemas);
    fullImpression.coreEvents.push(decodedEvent);
    if (watching) {
        watchResult.coreEvents.push(decodedEvent);
    }
}

export function onCompressedBatch(pubSubMessage: any, workerMessage: ICompressedBatchMessage): void {
    const compressedEvents = workerMessage.rawData.events.map((encodedEvent: IEventArray): IEvent => decode(encodedEvent, schemas));
    fullImpression.compressedEvents.push(...compressedEvents);
    if (watching) {
        watchResult.compressedEvents.push(...compressedEvents);
    }
}

export function onUpload(message: any, data: any): void {
    const compressedPayload = data;
    const payload: IPayload = JSON.parse(uncompress(compressedPayload));
    const decodedEvents = payload.events.map((encodedEvent: IEventArray): IEvent => decode(encodedEvent, schemas));
    fullImpression.sentEvents.push(...decodedEvents);
    fullImpression.sentEnvelopes.push(payload.envelope);
    if (watching) {
        watchResult.sentEvents.push(...decodedEvents);
        watchResult.sentEnvelopes.push(payload.envelope);
    }
}

export function filterEventsByType(events: IEvent[], type: string): IEvent[] {
    return events.filter((event: IEvent): boolean => event.type === type);
}
