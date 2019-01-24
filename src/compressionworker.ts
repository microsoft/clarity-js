import { IAddEventMessage, ICompressedBatchMessage, ITimestampedWorkerMessage, WorkerMessageType } from "../types/compressionworker";
import { IEnvelope, IEventArray, IPayload } from "../types/core";
import { config as Config } from "./config";

import Compress from "./compress";

export function createCompressionWorker(
  envelope: IEnvelope,
  onMessage?: (e: MessageEvent) => void,
  onError?: (e: ErrorEvent) => void
): Worker {
  let worker = null;
  if (Worker) {
    let workerUrl = createWorkerUrl(envelope);
    worker = new Worker(workerUrl);
    worker.onmessage = onMessage || null;
    worker.onerror = onError || null;
  }
  return worker;
}

function workerContext() {
  let workerGlobalScope = self as any;
  let compress = workerGlobalScope.compress;
  let config = workerGlobalScope.config;
  let envelope: IEnvelope = workerGlobalScope.envelope;
  let nextBatchEvents: IEventArray[] = [];
  let nextBatchBytes = 0;
  let sequence = 0;

  // Edge case: Flag to skip uploading batches consisting of a single XhrError instrumentation event
  // This helps us avoid the infinite loop in the case when all requests fail (e.g. dropped internet connection)
  // Infinite loop comes from sending instrumentation about failing to deliver previous delivery failure instrumentation.
  let nextBatchIsSingleXhrErrorEvent: boolean =  false;

  self.onmessage = (evt: MessageEvent) => {
    let message = evt.data;
    switch (message.type) {
      case WorkerMessageType.AddEvent:
        let addEventMsg = message as IAddEventMessage;
        addEvent(addEventMsg.event, addEventMsg.time, addEventMsg.isXhrErrorEvent);
        break;
      case WorkerMessageType.ForceCompression:
        let forceCompressionMsg = message as ITimestampedWorkerMessage;
        postNextBatchToCore(forceCompressionMsg.time);
        break;
      default:
        break;
    }
  };

  function addEvent(event: IEventArray, time: number, isXhrErrorEvent?: boolean): void {
    let eventStr = JSON.stringify(event);

    // If appending new event to next batch would exceed batch limit, then post next batch first
    if (nextBatchBytes > 0 && nextBatchBytes + eventStr.length > config.batchLimit) {
      postNextBatchToCore(time);
    }

    // // Append new event to the next batch
    nextBatchIsSingleXhrErrorEvent = (nextBatchEvents.length === 0 && isXhrErrorEvent);
    nextBatchEvents.push(event);
    nextBatchBytes += eventStr.length;

    // Even if we just posted next batch, it is possible that a single new event exceeds batch limit by itself, so we need to check again
    if (nextBatchBytes >= config.batchLimit) {
      postNextBatchToCore(time);
    }
  }

  function postNextBatchToCore(time: number): void {
    if (nextBatchBytes > 0 && !nextBatchIsSingleXhrErrorEvent) {
      envelope.sequenceNumber = sequence++;
      envelope.time = time;
      let raw: IPayload = { envelope, events: nextBatchEvents };
      let rawStr = JSON.stringify(raw);
      let compressed = compress(rawStr);
      nextBatchEvents = [];
      nextBatchBytes = 0;
      postToCore(compressed, raw);
    }
  }

  function postToCore(compressed: string, raw: IPayload): void {
    let message: ICompressedBatchMessage = {
      type: WorkerMessageType.CompressedBatch,
      compressedData: compressed,
      rawData: raw
    };

    // Post message to the main thread
    workerGlobalScope.postMessage(message);
  }
}

// Workers are initialized with a URL, pointing to the code which is going to be executed within worker's scope.
// URL can point to file, however we don't want to load a file with worker's code separately, so we create a Blob
// with a string containing worker's code. To build such string, we stitch together string representations of
// all functions and objects that are going to be required within the worker's scope.
// Once Blob is created, we create a URL pointing to it, which can be passed to worker's constructor.
function createWorkerUrl(envelope: IEnvelope): string {
  let workerContextStr = workerContext.toString();
  let workerStr = workerContextStr.substring(workerContextStr.indexOf("{") + 1, workerContextStr.lastIndexOf("}"));
  let code = `self.compress=${Compress.toString()};`
            + `self.config=${JSON.stringify(Config)};`
            + `self.envelope=${JSON.stringify(envelope)};`
            + workerStr;
  let blob = new Blob([code], {type: "application/javascript"});
  return URL.createObjectURL(blob);
}
