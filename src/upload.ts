import {
  Instrumentation, IPayload, IPayloadInfo, ITotalByteLimitExceededEventState, IXhrErrorEventState,
  State, UploadCallback
} from "../clarity";
import { config } from "./config";
import { ClarityAttribute, instrument, state, teardown } from "./core";
import { debug, getCookie, getEventId, guid, isNumber, mapProperties, setCookie } from "./utils";

// Counters
let sentBytesCount: number;
let uploadCount: number;

// Storage for payloads that are compressed and are ready to be sent, but are waiting for Clarity trigger.
// Once trigger is fired, all payloads from this queue will be sent in the order they were generated.
let payloadQueue: IPayloadInfo[];

// Map from a sequence number to an UploadInfo object for payloads that were attempted to be sent, but were not succesfully delivered yet
let payloadInfos: { [key: number]: IPayloadInfo };

let reUploadQueue: number[];

export function upload(compressed: string, raw: IPayload, onSuccessCustom?: UploadCallback, onFailureCustom?: UploadCallback) {
  let uploadHandler = config.uploadHandler || defaultUploadHandler;
  let sequenceNo = raw.envelope.sequenceNumber;
  let onSuccess = getOnUploadCompletedHandler(true, sequenceNo, onSuccessCustom);
  let onFailure = getOnUploadCompletedHandler(false, sequenceNo, onFailureCustom);
  payloadInfos[sequenceNo] = { compressed, raw, failureCount: 0 };
  uploadHandler(compressed, onSuccess, onFailure);

  if (config.debug) {
    let rawLength = JSON.stringify(raw).length;
    debug(`** Upload #${uploadCount}: Batch #${sequenceNo}`
          + ` ${Math.round(compressed.length / 1024.0)}KB`
          + ` (${Math.round(rawLength / 1024.0)}KB Raw). **`);
  }
  uploadCount++;
}

export function enqueuePayload(compressed: string, raw: IPayload) {
  let payloadInfo: IPayloadInfo = { compressed, raw, failureCount: 0 };
  payloadQueue.push(payloadInfo);
}

export function flushPayloadQueue() {
  uploadMultiplePayloads(payloadQueue);
}

export function resetUploads() {
  sentBytesCount = 0;
  uploadCount = 0;
  payloadQueue = [];
  payloadInfos = {};
  reUploadQueue = [];
}

function uploadMultiplePayloads(payloads: IPayloadInfo[]) {
  if (payloads.length > 0) {
    let nextPayload = payloads.shift();
    let uploadNextPayload = (status: number) => {
      uploadMultiplePayloads(payloads);
    };
    upload(nextPayload.compressed, nextPayload.raw, uploadNextPayload, uploadNextPayload);
  }
}

function defaultUploadHandler(payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) {
  if (config.uploadUrl.length > 0) {
    payload = JSON.stringify(payload);
    let xhr = new XMLHttpRequest();
    xhr.open("POST", config.uploadUrl);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => { onXhrReadyStatusChange(xhr, onSuccess, onFailure); };
    xhr.send(payload);
  }
}

function onXhrReadyStatusChange(xhr: XMLHttpRequest, onSuccess: UploadCallback, onFailure: UploadCallback) {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    // HTTP response status documentation:
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
    if (xhr.status < 200 || xhr.status > 208) {
      onFailure(xhr.status);
    } else {
      onSuccess(xhr.status);
    }
  }
}

function onSuccessDefault(sequenceNumber: number, status: number) {
  debug(`SUCCESS: Delivered batch #${sequenceNumber}`);
  let sentData = payloadInfos[sequenceNumber];
  delete payloadInfos[sequenceNumber];
  sentBytesCount += sentData.compressed.length;

  if (state === State.Activated && sentBytesCount > config.totalLimit) {
    let totalByteLimitExceededEventState: ITotalByteLimitExceededEventState = {
      type: Instrumentation.TotalByteLimitExceeded,
      bytes: sentBytesCount
    };
    instrument(totalByteLimitExceededEventState);
    teardown();
    return;
  }

  retryFailedUploads();
}

function onFailureDefault(sequenceNumber: number, status: number) {
  debug(`FAILED: Delivery failed for batch #${sequenceNumber} Status: ${status}`);
  let uploadInfo = payloadInfos[sequenceNumber];
  uploadInfo.failureCount++;
  logXhrError(sequenceNumber, status, uploadInfo);
  if (uploadInfo.failureCount <= config.reUploadLimit) {
    reUploadQueue.push(sequenceNumber);
  }
}

function logXhrError(sequenceNumber: number, status: number, payloadInfo: IPayloadInfo) {
  let events = payloadInfo.raw.events;
  let xhrErrorState: IXhrErrorEventState = {
    type: Instrumentation.XhrError,
    requestStatus: status,
    sequenceNumber,
    compressedLength: payloadInfo.compressed.length,
    rawLength: JSON.stringify(payloadInfo.raw).length,
    firstEventId: getEventId(events[0]),
    lastEventId: getEventId(events[events.length - 1]),
    attemptNumber: payloadInfo.failureCount
  };
  instrument(xhrErrorState);
}

function retryFailedUploads() {
  let payloads: IPayloadInfo[] = [];
  while (reUploadQueue.length > 0) {
    let nextPayloadSequenceNo = reUploadQueue.shift();
    payloads.push(payloadInfos[nextPayloadSequenceNo]);
  }
  uploadMultiplePayloads(payloads);
}

function getOnUploadCompletedHandler(success: boolean, sequenceNo: number, customHandler: UploadCallback) {
  let defaultHandler = success ? onSuccessDefault : onFailureDefault;
  let sourceImpressionId = document[ClarityAttribute];
  return (status: number) => {
    let currentImpressionId = document[ClarityAttribute];
    if (state === State.Activated && currentImpressionId === sourceImpressionId) {
      defaultHandler(sequenceNo, status);
      if (customHandler) {
        customHandler(status);
      }
    }
  };
}
