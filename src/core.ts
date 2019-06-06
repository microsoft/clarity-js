import compress from "./compress";
import EventToArray from "./converters/toarray";
import getPlugin from "./plugins";

import { IAddEventMessage, ICompressedBatchMessage, ITimestampedWorkerMessage, WorkerMessageType } from "@clarity-types/compressionworker";
import {
  IBindingContainer, IClarityFields, IEnvelope, IEvent, IEventArray, IEventBindingPair, IEventData, IPayload, IPlugin, State
} from "@clarity-types/core";
import {
  IClarityActivateErrorState, IClarityDuplicatedEventState, IInstrumentationEventState,
  IMissingFeatureEventState, Instrumentation, ITriggerState
} from "@clarity-types/instrumentation";
import { createCompressionWorker } from "./compressionworker";
import { config, resetConfig } from "./config";
import { resetSchemas } from "./converters/schema";
import { enqueuePayload, flushPayloadQueue, resetUploads, upload } from "./upload";
import { getCookie, getEventId, guid, isNumber, setCookie } from "./utils";

export const version = "0.3.2";
export const ClarityAttribute = "clarity-iid";
export const InstrumentationEventName = "Instrumentation";
const Cookie = "ClarityID";

let startTime: number;
let cid: string;
let impressionId: string;
let sequence: number;
let envelope: IEnvelope;
let activePlugins: IPlugin[];
let bindings: IBindingContainer;

// Counters
let eventCount: number;

// Storage for events that were posted to compression worker, but have not returned to core as compressed batches yet.
// When page is unloaded, keeping such event copies in core allows us to terminate compression worker safely and then
// compress and upload remaining events synchronously from the main thread.
let pendingEvents: { [key: number]: IEventArray };

let backgroundMode: boolean;
let compressionWorker: Worker;
let timeout: number;

export let state: State = State.Loaded;

export function activate(): void {
  state = State.Activating;

  // First, try to initalize core variables to allow Clarity perform minimal logging and safe teardowns.
  // If this step fails, attempt a potentially unsafe logging and teardown.
  try {
    init();
  } catch (e) {
    onActivateErrorUnsafe(e);
    return;
  }

  // Next, prepare for activation and activate available plugins.
  // If anything goes wrong at this stage, we should be able to perform a safe teardown.
  try {
    let readyToActivatePlugins = prepare();
    if (readyToActivatePlugins) {
      activatePlugins();
    } else {
      teardown();
      return;
    }
  } catch (e) {
    onActivateError(e);
    return;
  }

  state = State.Activated;
}

export function teardown(): void {
  if (state === State.Activating || state === State.Activated) {
    state = State.Unloading;
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

    if (compressionWorker) {
      // Immediately terminate the worker and kill its thread.
      // Any possible pending incoming messages from the worker will be ignored in the 'Unloaded' state.
      // Copies of all the events that were sent to the worker, but have not been returned as a compressed batch yet,
      // are stored in the 'pendingEvents' object, so we will compress and upload them synchronously in this thread.
      compressionWorker.terminate();
    }
    state = State.Unloaded;

    // Instrument teardown and upload residual events
    instrument({ type: Instrumentation.Teardown });
    uploadPendingEvents();
    resetConfig();

    delete document[ClarityAttribute];
  }
}

export function bind(target: EventTarget, event: string, listener: EventListener): void {
  let eventBindings = bindings[event] || [];
  target.addEventListener(event, listener, false);
  eventBindings.push({
    target,
    listener
  });
  bindings[event] = eventBindings;
}

export function addEvent(event: IEventData, scheduleUpload: boolean = true): void {
  let evtJson: IEvent = {
    id: eventCount++,
    time: isNumber(event.time) ? event.time : getTimestamp(),
    type: event.type,
    state: event.state
  };
  let evt = EventToArray(evtJson);
  let addEventMessage: IAddEventMessage = {
    type: WorkerMessageType.AddEvent,
    event: evt,
    time: getTimestamp(),
    isXhrErrorEvent: event.type === InstrumentationEventName && event.state.type === Instrumentation.XhrError
  };
  if (compressionWorker) {
    compressionWorker.postMessage(addEventMessage);
  }
  pendingEvents[evtJson.id] = evt;
  if (scheduleUpload) {
    clearTimeout(timeout);
    timeout = window.setTimeout(forceCompression, config.delay);
  }
}

export function addMultipleEvents(events: IEventData[]): void {
  if (events.length > 0) {
    // Don't schedule upload until we add the last event
    for (let i = 0; i < events.length - 1; i++) {
      addEvent(events[i], false);
    }
    let lastEvent = events[events.length - 1];
    addEvent(lastEvent, true);
  }
}

export function onTrigger(key: string): void {
  if (state === State.Activated) {
    let triggerState: ITriggerState = {
      type: Instrumentation.Trigger,
      key
    };
    instrument(triggerState);
    backgroundMode = false;
    flushPayloadQueue();
  }
}

export function forceCompression(): void {
  if (compressionWorker) {
    let forceCompressionMessage: ITimestampedWorkerMessage = {
      type: WorkerMessageType.ForceCompression,
      time: getTimestamp()
    };
    compressionWorker.postMessage(forceCompressionMessage);
  }
}

export function getTimestamp(unix?: boolean, raw?: boolean): number {
  let time = unix ? getUnixTimestamp() : getPageContextBasedTimestamp();
  return (raw ? time : Math.round(time));
}

export function instrument(eventState: IInstrumentationEventState): void {
  if (config.instrument) {
    addEvent({type: InstrumentationEventName, state: eventState});
  }
}

export function onWorkerMessage(evt: MessageEvent): void {
  if (state !== State.Unloaded) {
    let message = evt.data;
    switch (message.type) {
      case WorkerMessageType.CompressedBatch:
        let uploadMsg = message as ICompressedBatchMessage;
        if (backgroundMode) {
          enqueuePayload(uploadMsg.compressedData, uploadMsg.rawData);
        } else {
          upload(uploadMsg.compressedData, uploadMsg.rawData);
        }
        sequence = uploadMsg.rawData.envelope.sequenceNumber + 1;

        // Clear records for the compressed events returned by the worker
        let events = uploadMsg.rawData.events;
        for (let i = 0; i < events.length; i++) {
          let evtId = getEventId(events[i]);
          delete pendingEvents[evtId];
        }
        break;
      default:
        break;
    }
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

function uploadPendingEvents(): void {
  // We don't want to upload any data if Clarity is in background mode
  if (backgroundMode) {
    return;
  }
  let events: IEventArray[] = [];
  let keys = Object.keys(pendingEvents);
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let val = pendingEvents[key];
    events.push(val);
  }
  if (events.length > 0) {
    envelope.sequenceNumber = sequence++;
    envelope.time = getTimestamp();
    let raw: IPayload = { envelope, events };
    let compressed = compress(JSON.stringify(raw));
    upload(compressed, raw);
  }
}

function init(): void {
  // Set ClarityID cookie, if it's not set already and is allowed by config
  if (!config.disableCookie && !getCookie(Cookie)) {
    // setting our ClarityId cookie for 1 year (52 weeks)
    setCookie(Cookie, guid(), 7 * 52);
  }

  cid = config.disableCookie ? guid() : getCookie(Cookie);
  impressionId = guid();

  startTime = getUnixTimestamp();
  sequence = 0;

  envelope = {
    clarityId: cid,
    impressionId,
    projectId: config.projectId || null,
    url: window.location.href,
    version
  };

  resetSchemas();
  resetUploads();

  if (config.customInstrumentation) {
    let fields: IClarityFields = {
      impressionId,
      clientId: cid,
      projectId: config.projectId
    };
    let customInst = config.customInstrumentation(fields);
    envelope.extraInfo = {};
    for (let key in customInst) {
      if (customInst.hasOwnProperty(key) && customInst[key]) {
        envelope.extraInfo[key] = customInst[key];
      }
    }
  }

  activePlugins = [];
  bindings = {};
  pendingEvents = [];
  backgroundMode = config.backgroundMode;

  eventCount = 0;

  compressionWorker = createCompressionWorker(envelope, onWorkerMessage);
}

function prepare(): boolean {
  // If critical API is missing, don't activate Clarity
  if (!checkFeatures()) {
    return false;
  }

  // Check that no other instance of Clarity is already running on the page
  if (document[ClarityAttribute]) {
    let eventState: IClarityDuplicatedEventState = {
      type: Instrumentation.ClarityDuplicated,
      currentImpressionId: document[ClarityAttribute]
    };
    instrument(eventState);
    return false;
  }

  document[ClarityAttribute] = impressionId;
  bind(window, "beforeunload", teardown);
  bind(window, "unload", teardown);
  return true;
}

function activatePlugins(): void {
  for (let plugin of config.plugins) {
    let pluginClass = getPlugin(plugin);
    if (pluginClass) {
      let instance = new (pluginClass)();
      instance.reset();
      instance.activate();
      activePlugins.push(instance);
    }
  }
}

function onActivateErrorUnsafe(e: Error): void {
  try {
    onActivateError(e);
  } catch (e) {
    // If there is an error at this stage, there is not much we can do any more, so just ignore and exit.
  }
}

function onActivateError(e: Error): void {
  let clarityActivateError: IClarityActivateErrorState = {
    type: Instrumentation.ClarityActivateError,
    error: e.message
  };
  instrument(clarityActivateError);
  teardown();
}

function checkFeatures(): boolean {
  let missingFeatures = [];
  let expectedFeatures = [
    "document.implementation.createHTMLDocument",
    "document.documentElement.classList",
    "Function.prototype.bind",
    "window.Worker"
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
