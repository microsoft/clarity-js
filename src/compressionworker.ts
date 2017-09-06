import compress from "./compress";
import { config } from "./config";

export function createCompressionWorker(
  envelope: IEnvelope,
  onMessage?: (e: MessageEvent) => void,
  onError?: (e: ErrorEvent) => void
): Worker {
  let workerUrl = createWorkerUrl(envelope);
  let worker = new Worker(workerUrl);
  worker.onmessage = onMessage || null;
  worker.onerror = onError || null;
  return worker;
}

function workerContext() {
  let workerGlobalScope = self as any;
  let compress = workerGlobalScope.compress;
  let config = workerGlobalScope.config;
  let envelope: IEnvelope = workerGlobalScope.envelope;
  let nextPayloadEvents: IEvent[] = [];
  let nextPayloadBytes = 0;
  let sequence = 0;

  // Edge case: Flag to skip uploading payloads consisting of a single XhrError instrumentation event
  // This helps us avoid the infinite loop in the case when all requests fail (e.g. dropped internet connection)
  // Infinite loop comes from sending instrumentation about failing to deliver previous delivery failure instrumentation.
  let nextPayloadIsSingleXhrErrorEvent: boolean =  false;

  onmessage = (evt: MessageEvent) => {
    let message = evt.data;
    switch (message.type) {
      case WorkerMessageType.AddEvent:
        let addEventMsg = message as IAddEventMessage;
        addEvent(addEventMsg.event, addEventMsg.time);
        break;
      case WorkerMessageType.ForceUpload:
        let forceUploadMsg = message as ITimestampedWorkerMessage;
        uploadNextPayload(forceUploadMsg.time);
        break;
      default:
        break;
    }
  };

  function addEvent(event: IEvent, time: number): void {
    let eventStr = JSON.stringify(event);

    // If appending new event to next payload would exceed batch limit, then flush next payload first
    if (nextPayloadBytes > 0 && nextPayloadBytes + eventStr.length > config.batchLimit) {
      uploadNextPayload(time);
    }

    // Append new event to the next payload
    nextPayloadEvents.push(event);
    nextPayloadBytes += eventStr.length;
    nextPayloadIsSingleXhrErrorEvent = (nextPayloadEvents.length === 1 && event.state && event.state.type === Instrumentation.XhrError);

    // Even if we just flushed next payload, it is possible that a single new event exceeds batch limit itself, so we need to check again
    if (nextPayloadBytes >= config.batchLimit) {
      uploadNextPayload(time);
    }
  }

  function uploadNextPayload(time: number): void {
    if (nextPayloadBytes > 0 && !nextPayloadIsSingleXhrErrorEvent) {
      envelope.sequenceNumber = sequence++;
      envelope.time = time;
      let raw = JSON.stringify({ envelope, events: nextPayloadEvents });
      let compressed = compress(raw);
      let eventCount = nextPayloadEvents.length;
      nextPayloadEvents = [];
      nextPayloadBytes = 0;
      upload(compressed, raw, eventCount);
    }
  }

  function upload(compressed: string, uncompressed: string, eventCount: number): void {
    let message: IUploadMessage = {
      type: WorkerMessageType.Upload,
      compressedData: compressed,
      rawData: uncompressed,
      eventCount
    };

    // Post message to the main thread
    workerGlobalScope.postMessage(message);
  }
}

function createWorkerUrl(envelope: IEnvelope): string {
  // Workers are initialized with a URL, pointing to the code which is going to be executed within worker's scope.
  // URL can point to file, however we don't want to load a file with worker's code separately, so we create a Blob
  // with a string containing worker's code. To build such string, we stitch together string representations of
  // all functions and objects that are going to be required within the worker's scope.
  // Once Blob is created, we create a URL pointing to it, which can be passed to worker's constructor.
  let workerContextStr = workerContext.toString();
  let workerStr = workerContextStr.substring(workerContextStr.indexOf("{") + 1, workerContextStr.lastIndexOf("}"));
  let compressStr = `self.compress=${compress.toString()};`;
  let configStr = `self.config=${JSON.stringify(config)};`;
  let envelopeStr = `self.envelope=${JSON.stringify(envelope)};`;
  let code = compressStr + configStr + envelopeStr + workerStr;
  let blob = new Blob([code], {type: "application/javascript"});
  return URL.createObjectURL(blob);
}
