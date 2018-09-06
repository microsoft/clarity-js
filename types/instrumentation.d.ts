import { ILayoutRoutineInfo, NumberJson } from "./layout";

export const enum Instrumentation {
  JsError,
  MissingFeature,
  XhrError,
  TotalByteLimitExceeded,
  Teardown,
  ClarityAssertFailed,
  ClarityDuplicated,
  ShadowDomInconsistent,
  ClarityActivateError,
  Trigger
}

export interface IInstrumentationEventState {
  type: Instrumentation;
}

export interface IJsErrorEventState extends IInstrumentationEventState {
  source: string;
  message: string;
  stack: string;
  lineno: number;
  colno: number;
}

export interface IMissingFeatureEventState extends IInstrumentationEventState {
  missingFeatures: string[];
}

export interface IXhrErrorEventState extends IInstrumentationEventState {
  requestStatus: number;
  sequenceNumber: number;
  compressedLength: number;
  rawLength: number;
  firstEventId: number;
  lastEventId: number;
  attemptNumber: number;
}

export interface ITotalByteLimitExceededEventState extends IInstrumentationEventState {
  bytes: number;
}

export interface IClarityAssertFailedEventState extends IInstrumentationEventState {
  source: string;
  comment: string;
}

export interface IClarityDuplicatedEventState extends IInstrumentationEventState {
  currentImpressionId: string;
}

export interface IShadowDomInconsistentEventState extends IInstrumentationEventState {
  // JSON of node indicies, representing the DOM
  dom: NumberJson;

  // JSON of ShadowNode IDs, representing the inconsistent ShadowDom
  shadowDom: NumberJson;

  // JSON of ShadowNode IDs, representing the last consistent ShadowDom
  lastConsistentShadowDom: NumberJson;

  // Last action that happened before we found out that ShadowDom is inconsistent
  lastAction: ILayoutRoutineInfo;

  // To handle specific MutationObserver behavior in IE, we wait for ShadowDom to become inconsistent twice in a row,
  // before we stop processing mutations and send ShadowDomInconsistentEvent. This means that the actual transition
  // from consistent to inconsistent state happened on some previous action and there was also an event created for it.
  // That first event is sent in this property.
  firstEvent?: IShadowDomInconsistentEventState;
}

export interface IClarityActivateErrorState extends IInstrumentationEventState {
  error: string;
}

export interface ITriggerState extends IInstrumentationEventState {
  key: string;
}
