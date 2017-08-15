import compress from "./compress";
import { config } from "./config";
import getPlugin from "./plugins";
import { debug, getCookie, guid, isNumber, mapProperties, setCookie } from "./utils";

// Constants
const version = "0.1.9";
const ImpressionAttribute = "data-iid";
const UserAttribute = "data-cid";
const Cookie = "ClarityID";
export const ClarityAttribute = "clarity-iid";

// Variables
let sentBytesCount: number;
let cid: string;
let impressionId: string;
let sequence: number;
let eventCount: number;
let startTime: number;
let activePlugins: IPlugin[];
let bindings: IBindingContainer;
let droppedPayloads: { [key: number]: IDroppedPayloadInfo };
let timeout: number;
let nextPayload: string[];
let nextPayloadLength: number;
export let state: State = State.Loaded;

export function activate() {
  if (init()) {
    document[ClarityAttribute] = impressionId;
    for (let plugin of config.plugins) {
      let pluginClass = getPlugin(plugin);
      if (pluginClass) {
        let instance = new (pluginClass)();
        instance.reset();
        instance.activate();
        activePlugins.push(instance);
      }
    }

    bind(window, "beforeunload", teardown);
    bind(window, "unload", teardown);
    state = State.Activated;
  }
}

export function teardown() {
  for (let plugin of activePlugins) {
    plugin.teardown();
  }

  // Walk through existing list of bindings and remove them all
  for (let evt in bindings) {
    if (bindings.hasOwnProperty(evt)) {
      let eventBindings = bindings[evt] as IEventBindingPair[];
      for (let i = 0; i < eventBindings.length; i++) {
        (eventBindings[i].target).removeEventListener(evt, eventBindings[i].listener);
      }
    }
  }

  delete document[ClarityAttribute];
  state = State.Unloaded;

  // Upload residual events
  instrument({ type: Instrumentation.Teardown });
  uploadNextPayload();
}

export function bind(target: EventTarget, event: string, listener: EventListener) {
  let eventBindings = bindings[event] || [];
  target.addEventListener(event, listener, false);
  eventBindings.push({
    target,
    listener
  });
  bindings[event] = eventBindings;
}

export function addEvent(event: IEventData, scheduleUpload: boolean = true) {
  let evt: IEvent = {
    id: eventCount++,
    time: isNumber(event.time) ? event.time : getTimestamp(),
    type: event.type,
    state: event.state
  };
  let eventStr = JSON.stringify(evt);
  if (nextPayloadLength > 0 && nextPayloadLength + eventStr.length > config.batchLimit) {
    uploadNextPayload();
  }
  nextPayload.push(eventStr);
  nextPayloadLength += eventStr.length;

  // Edge case:
  // Don't schedule next upload when next payload consists of exactly one XhrError instrumentation event.
  // This helps us avoid the infinite loop in the case when all requests fail (e.g. dropped internet connection)
  // Infinite loop comes from sending instrumentation about failing to deliver previous delivery failure instrumentation.
  let payloadIsSingleXhrErrorEvent = event.state && event.state.type === Instrumentation.XhrError && nextPayload.length === 1;
  if (scheduleUpload && !payloadIsSingleXhrErrorEvent) {
    clearTimeout(timeout);
    timeout = setTimeout(uploadNextPayload, config.delay);
  }
}

export function addMultipleEvents(events: IEventData[]) {
  if (events.length > 0) {
    // Don't schedule upload until we add the last event
    for (let i = 0; i < events.length - 1; i++) {
      addEvent(events[i], false);
    }
    let lastEvent = events[events.length - 1];
    addEvent(lastEvent, true);
  }
}

export function getTimestamp(unix?: boolean, raw?: boolean) {
  let time = unix ? getUnixTimestamp() : getPageContextBasedTimestamp();
  return (raw ? time : Math.round(time));
}

export function instrument(eventState: IInstrumentationEventState) {
  if (config.instrument) {
    addEvent({type: "Instrumentation", state: eventState});
  }
}

function getUnixTimestamp(): number {
  return (window.performance && performance.now && performance.timing)
    ? performance.now() + performance.timing.navigationStart
    : new Date().getTime();
}

// If performance.now function is not available, we do our best to approximate the time since page start
// by using the timestamp from when Clarity script got invoked as a starting point.
// In such case this number may not reflect the 'time since page start' accurately,
// especially if Clarity script is post-loaded or injected after page load.
function getPageContextBasedTimestamp(): number {
  return (window.performance && performance.now)
    ? performance.now()
    : new Date().getTime() - startTime;
}

function envelope(): IEnvelope {
  return {
    clarityId: cid,
    impressionId,
    url: window.location.href,
    version,
    time: Math.round(getPageContextBasedTimestamp()),
    sequenceNumber: sequence++
  };
}

function uploadNextPayload() {
  if (nextPayloadLength > 0) {
    let uncompressed = `{"envelope":${JSON.stringify(envelope())},"events":[${nextPayload.join()}]}`;
    let compressed = compress(uncompressed);
    let onSuccess = (status: number) => { mapProperties(droppedPayloads, uploadDroppedPayloadsMappingFunction, true); };
    let onFailure = (status: number) => { onFirstSendDeliveryFailure(status, uncompressed, compressed); };

    nextPayload = [];
    nextPayloadLength = 0;
    upload(compressed, onSuccess, onFailure);

    if (config.debug && localStorage) {
      let compressedKb = Math.ceil(compressed.length / 1024.0);
      let rawKb = Math.ceil(uncompressed.length / 1024.0);
      debug(`** Clarity #${sequence}: Uploading ${compressedKb}KB (raw: ${rawKb}KB). **`);
    }

    if (state === State.Activated && sentBytesCount > config.totalLimit) {
      let totalByteLimitExceededEventState: ITotalByteLimitExceededEventState = {
        type: Instrumentation.TotalByteLimitExceeded,
        bytes: sentBytesCount
      };
      instrument(totalByteLimitExceededEventState);
      teardown();
    }
  }
}

function uploadDroppedPayloadsMappingFunction(sequenceNumber: string, droppedPayloadInfo: IDroppedPayloadInfo) {
  let onSuccess = (status: number) => { onResendDeliverySuccess(droppedPayloadInfo); };
  let onFailure = (status: number) => { onResendDeliveryFailure(status, droppedPayloadInfo); };
  upload(droppedPayloadInfo.payload, onSuccess, onFailure);
}

function upload(payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) {
  if (config.uploadHandler) {
    config.uploadHandler(payload, onSuccess, onFailure);
  } else {
    defaultUpload(payload, onSuccess, onFailure);
  }
  sentBytesCount += payload.length;
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

function onFirstSendDeliveryFailure(status: number, rawPayload: string, compressedPayload: string) {
  let sentObj: IPayload = JSON.parse(rawPayload);
  let xhrErrorEventState: IXhrErrorEventState = {
    type: Instrumentation.XhrError,
    requestStatus: status,
    sequenceNumber: sentObj.envelope.sequenceNumber,
    compressedLength: compressedPayload.length,
    rawLength: rawPayload.length,
    firstEventId: sentObj.events[0].id,
    lastEventId: sentObj.events[sentObj.events.length - 1].id,
    attemptNumber: 0
  };
  droppedPayloads[xhrErrorEventState.sequenceNumber] = {
    payload: compressedPayload,
    xhrErrorState: xhrErrorEventState
  };
  instrument(xhrErrorEventState);
  sentBytesCount -= compressedPayload.length;
}

function onResendDeliveryFailure(status: number, droppedPayloadInfo: IDroppedPayloadInfo) {
  droppedPayloadInfo.xhrErrorState.requestStatus = status;
  droppedPayloadInfo.xhrErrorState.attemptNumber++;
  instrument(droppedPayloadInfo.xhrErrorState);
}

function onResendDeliverySuccess(droppedPayloadInfo: IDroppedPayloadInfo) {
  delete droppedPayloads[droppedPayloadInfo.xhrErrorState.sequenceNumber];
}

function init() {
  cid = getCookie(Cookie);
  impressionId = guid();
  sequence = 0;
  eventCount = 0;
  startTime = getUnixTimestamp();
  activePlugins = [];
  bindings = {};
  nextPayload = [];
  droppedPayloads = {};
  nextPayloadLength = 0;
  sentBytesCount = 0;

  // If CID cookie isn't present, set it now
  if (!cid) {
    cid = guid();
    setCookie(Cookie, cid);
  }

  // Check that no other instance of Clarity is already running on the page
  if (document[ClarityAttribute]) {
    let eventState: IClarityDuplicatedEventState = {
      type: Instrumentation.ClarityDuplicated,
      currentImpressionId: document[ClarityAttribute]
    };
    instrument(eventState);
    teardown();
    return false;
  }

  // If critical API is missing, don't activate Clarity
  if (!checkFeatures()) {
    teardown();
    return false;
  }

  return true;
}

function checkFeatures() {
  let missingFeatures = [];
  let expectedFeatures = [
    "document.implementation.createHTMLDocument",
    "document.documentElement.classList",
    "Function.prototype.bind"
  ];

  for (let feature of expectedFeatures) {
    let parts = feature.split(".");
    let api = window;
    for (let part of parts) {
      if (typeof api[part] === "undefined") {
        missingFeatures.push(feature);
        break;
      }
      api = api[part];
    }
  }

  if (missingFeatures.length > 0) {
    instrument({
      type: Instrumentation.MissingFeature,
      missingFeatures
    } as IMissingFeatureEventState);
    return false;
  }

  return true;
}

// Initialize bindings early, so that registering and wiring up can be done properly
bindings = {};
