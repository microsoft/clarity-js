import {
  Instrumentation, IPayload, ITotalByteLimitExceededEventState, IUploadInfo, IXhrErrorEventState,
  State, UploadCallback
} from "../clarity";
import { config } from "./config";
import { instrument, state, teardown } from "./core";
import { debug, getCookie, getEventId, guid, isNumber, mapProperties, setCookie } from "./utils";

// Counters
let sentBytesCount: number;
let uploadCount: number;

// Storage for payloads that are compressed and are ready to be sent, but are waiting for Clarity trigger.
// Once trigger is fired, all payloads from this queue will be sent in the order they were generated.
let uploadQueue: IUploadInfo[];

// Map from a sequence number to an UploadInfo object for payloads that were attempted to be sent, but were not succesfully delivered yet
let uploadInfos: { [key: number]: IUploadInfo };

let reUploadQueue: number[];

export function upload(compressed: string, raw: IPayload, onSuccessExtra?: UploadCallback, onFailureExtra?: UploadCallback) {
  let uploadHandler = config.uploadHandler || defaultUpload;
  let sequenceNo = raw.envelope.sequenceNumber;
  let onSuccess = (status: number) => {
    onSuccessDefault(sequenceNo, status);
    if (onSuccessExtra) {
      onSuccessExtra(status);
    }
  };
  let onFailure = (status: number) => {
    onFailureDefault(sequenceNo, status);
    if (onFailureExtra) {
      onFailureExtra(status);
    }
  };
  uploadInfos[sequenceNo] = { compressed, raw, failureCount: 0 };
  uploadHandler(compressed, onSuccess, onFailure);

  if (config.debug) {
    let rawLength = JSON.stringify(raw).length;
    debug(`** Upload #${uploadCount}: Batch #${sequenceNo}`
          + ` ${Math.round(compressed.length / 1024.0)}KB`
          + ` (${Math.round(rawLength / 1024.0)}KB Raw). **`);
  }
  uploadCount++;
}

export function enqueueUpload(compressed: string, raw: IPayload) {
  let payloadInfo: IUploadInfo = { compressed, raw, failureCount: 0 };
  uploadQueue.push(payloadInfo);
}

export function flushUploadQueue() {
  uploadSequentially(uploadQueue);
}

export function uploadSequentially(uploads: IUploadInfo[]) {
  if (uploads.length > 0) {
    let nextUpload = uploads.shift();
    let uploadNext = (status: number) => {
      uploadSequentially(uploads);
    };
    upload(nextUpload.compressed, nextUpload.raw, uploadNext, uploadNext);
  }
}

export function resetUploads() {
  sentBytesCount = 0;
  uploadCount = 0;
  uploadQueue = [];
  uploadInfos = {};
  reUploadQueue = [];
}

function defaultUpload(payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) {
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
  let sentData = uploadInfos[sequenceNumber];
  delete uploadInfos[sequenceNumber];
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

  reUpload();
}

function onFailureDefault(sequenceNumber: number, status: number) {
  debug(`FAILED: Delivery failed for batch #${sequenceNumber} Status: ${status}`);
  let uploadInfo = uploadInfos[sequenceNumber];
  uploadInfo.failureCount++;
  logXhrError(sequenceNumber, status, uploadInfo);
  if (uploadInfo.failureCount <= config.reUploadLimit) {
    reUploadQueue.push(sequenceNumber);
  }
}

function logXhrError(sequenceNumber: number, status: number, uploadInfo: IUploadInfo) {
  let events = uploadInfo.raw.events;
  let xhrErrorState: IXhrErrorEventState = {
    type: Instrumentation.XhrError,
    requestStatus: status,
    sequenceNumber,
    compressedLength: uploadInfo.compressed.length,
    rawLength: JSON.stringify(uploadInfo.raw).length,
    firstEventId: getEventId(events[0]),
    lastEventId: getEventId(events[events.length - 1]),
    attemptNumber: uploadInfo.failureCount
  };
  instrument(xhrErrorState);
}

function reUpload() {
  let reUploads: IUploadInfo[] = [];
  while (reUploadQueue.length > 0) {
    let nextUploadSequenceNo = reUploadQueue.shift();
    reUploads.push(uploadInfos[nextUploadSequenceNo]);
  }
  uploadSequentially(reUploads);
}
