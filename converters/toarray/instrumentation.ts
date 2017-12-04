import { attributeUpdateToArray } from "./layout";

export function instrumentationToArray(instrumentationData: IInstrumentationEventData) {
  return [instrumentationData.type];
}

export function jsErrorToArray(jsErrorData: IJsErrorEventData) {
  let data = [
    jsErrorData.type,
    jsErrorData.source,
    jsErrorData.message,
    jsErrorData.stack,
    jsErrorData.lineno,
    jsErrorData.colno
  ];
  return data;
}

export function missingFeatureToArray(missingFeatureData: IMissingFeatureEventData) {
  let data = [
    missingFeatureData.type,
    missingFeatureData.missingFeatures
  ];
  return data;
}

export function xhrErrorToArray(xhrErrorData: IXhrErrorEventData) {
  let data = [
    xhrErrorData.type,
    xhrErrorData.requestStatus,
    xhrErrorData.sequenceNumber,
    xhrErrorData.compressedLength,
    xhrErrorData.rawLength,
    xhrErrorData.firstEventId,
    xhrErrorData.lastEventId,
    xhrErrorData.attemptNumber
  ];
  return data;
}

export function byteLimitExceededToArray(byteLimitData: ITotalByteLimitExceededEventData) {
  let data = [
    byteLimitData.type,
    byteLimitData.bytes
  ];
  return data;
}

export function assertFailedToArray(failedAssertData: IClarityAssertFailedEventData) {
  let data = [
    failedAssertData.type,
    failedAssertData.source,
    failedAssertData.comment
  ];
  return data;
}

export function clarityDuplicatedToArray(clarityDuplicatedData: IClarityDuplicatedEventData) {
  let data = [
    clarityDuplicatedData.type,
    clarityDuplicatedData.currentImpressionId
  ];
  return data;
}

export function inconsistentShadowDomToArray(inconsistentShadowDomData: IShadowDomInconsistentEventData) {
  let data = [
    inconsistentShadowDomData.type,
    inconsistentShadowDomData.dom,
    inconsistentShadowDomData.shadowDom,
    inconsistentShadowDomData.lastConsistentShadowDom,
    inconsistentShadowDomData.lastAction,
    "firstEvent" in inconsistentShadowDomData
      ? inconsistentShadowDomToArray(inconsistentShadowDomData.firstEvent)
      : null
  ];
  return data;
}

export function clarityActivateErrorToArray(clarityActivateErrorData: IClarityActivateErrorEventData) {
  let data = [
    clarityActivateErrorData.type,
    clarityActivateErrorData.error
  ];
  return data;
}
