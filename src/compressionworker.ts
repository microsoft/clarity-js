import compress from "./compress";
import { config } from "./config";

export function createCompressionWorker(
  sampleEnvelope: IEnvelope,
  onMessage?: (e: MessageEvent) => void,
  onError?: (e: ErrorEvent) => void
): Worker {
  let worker = null;
  if (Worker) {
    let workerUrl = createWorkerUrl(sampleEnvelope);
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
  let nextPayload: string[] = [];
  let nextPayloadLength = 0;
  let sequence = 0;

  // Edge case: Don't schedule next upload for XhrError instrumentation events
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
      case WorkerMessageType.Terminate:
        let terminatedMsg = message as ITimestampedWorkerMessage;
        uploadNextPayload(terminatedMsg.time);
        self.close();
      default:
        break;
    }
  };

  function addEvent(event: IEvent, time: number) {
    let eventStr = JSON.stringify(event);
    if (nextPayloadLength > 0 && nextPayloadLength + eventStr.length > config.batchLimit) {
      uploadNextPayload(time);
    }
    nextPayload.push(eventStr);
    nextPayloadLength += eventStr.length;
    nextPayloadIsSingleXhrErrorEvent = (nextPayload.length === 1 && event.state && event.state.type === Instrumentation.XhrError);
    if (nextPayloadLength >= config.batchLimit) {
      uploadNextPayload(time);
    }
  }

  function uploadNextPayload(time: number) {
    if (nextPayloadLength > 0 && !nextPayloadIsSingleXhrErrorEvent) {
      envelope.sequenceNumber = sequence++;
      envelope.time = time;
      let raw = `{"envelope":${JSON.stringify(envelope)},"events":[${nextPayload.join()}]}`;
      let compressed = compress(raw);
      nextPayload = [];
      nextPayloadLength = 0;
      upload(compressed, raw);
    }
  }

  function upload(compressed: string, uncompressed: string) {
    let message: IUploadMessage = {
      type: WorkerMessageType.Upload,
      compressedData: compressed,
      rawData: uncompressed
    };
    workerGlobalScope.postMessage(JSON.stringify(message));
  }
}

function createWorkerUrl(sampleEnvelope: IEnvelope): string {
  let workerContextStr = workerContext.toString();
  let workerStr = workerContextStr.substring(workerContextStr.indexOf("{") + 1, workerContextStr.lastIndexOf("}"));
  let compressStr = `self.compress=${compress.toString()};`;
  let configStr = `self.config=${JSON.stringify(config)};`;
  let envelopeStr = `self.envelope=${JSON.stringify(sampleEnvelope)};`;
  let code = compressStr + configStr + envelopeStr + workerStr;
  let blob = new Blob([code], {type: "application/javascript"});
  return URL.createObjectURL(blob);
}
