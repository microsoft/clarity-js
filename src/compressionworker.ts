import compress from "./compress";
import { config } from "./config";

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
  let nextPayloadEvents: IEvent[] = [];
  let nextPayloadBytes = 0;
  let sequence = 0;

  // Edge case: Flag to skip uploading payloads consisting of a single XhrError instrumentation event
  // This helps us avoid the infinite loop in the case when all requests fail (e.g. dropped internet connection)
  // Infinite loop comes from sending instrumentation about failing to deliver previous delivery failure instrumentation.
  let nextPayloadIsSingleXhrErrorEvent: boolean =  false;

  onmessage = (evt: MessageEvent) => {
    let message = JSON.parse(evt.data) as IWorkerMessage;
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

  function addEvent(event: IEvent, time: number) {
    let eventStr = JSON.stringify(event);
    if (nextPayloadBytes > 0 && nextPayloadBytes + eventStr.length > config.batchLimit) {
      uploadNextPayload(time);
    }
    nextPayloadBytes += eventStr.length;
    nextPayloadEvents.push(event);
    nextPayloadIsSingleXhrErrorEvent = (nextPayloadEvents.length === 1 && event.state && event.state.type === Instrumentation.XhrError);
    if (nextPayloadBytes >= config.batchLimit) {
      uploadNextPayload(time);
    }
  }

  function uploadNextPayload(time: number) {
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

  function upload(compressed: string, uncompressed: string, eventCount: number) {
    let message: IUploadMessage = {
      type: WorkerMessageType.Upload,
      compressedData: compressed,
      rawData: uncompressed,
      eventCount
    };
    workerGlobalScope.postMessage(JSON.stringify(message));
  }
}

function createWorkerUrl(envelope: IEnvelope): string {
  let workerContextStr = workerContext.toString();
  let workerStr = workerContextStr.substring(workerContextStr.indexOf("{") + 1, workerContextStr.lastIndexOf("}"));
  let compressStr = `self.compress=${compress.toString()};`;
  let configStr = `self.config=${JSON.stringify(config)};`;
  let envelopeStr = `self.envelope=${JSON.stringify(envelope)};`;
  let code = compressStr + configStr + envelopeStr + workerStr;
  let blob = new Blob([code], {type: "application/javascript"});
  return URL.createObjectURL(blob);
}
