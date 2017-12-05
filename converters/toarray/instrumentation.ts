let instrumentationConverters = [];
instrumentationConverters[Instrumentation.JsError] = jsErrorToArray;
instrumentationConverters[Instrumentation.MissingFeature] = missingFeatureToArray;
instrumentationConverters[Instrumentation.XhrError] = xhrErrorToArray;
instrumentationConverters[Instrumentation.TotalByteLimitExceeded] = byteLimitExceededToArray;
instrumentationConverters[Instrumentation.Teardown] = noDataToArray;
instrumentationConverters[Instrumentation.PerformanceStateError] = noDataToArray;
instrumentationConverters[Instrumentation.ClarityAssertFailed] = assertFailedToArray;
instrumentationConverters[Instrumentation.ClarityDuplicated] = clarityDuplicatedToArray;
instrumentationConverters[Instrumentation.ClarityActivateError] = clarityActivateErrorToArray;
instrumentationConverters[Instrumentation.ShadowDomInconsistent] = inconsistentShadowDomToArray;

export default instrumentationConverters;

function jsErrorToArray(jsErrorData: IJsErrorEventData) {
  let data = [
    jsErrorData.source,
    jsErrorData.message,
    jsErrorData.stack,
    jsErrorData.lineno,
    jsErrorData.colno
  ];
  return data;
}

function missingFeatureToArray(missingFeatureData: IMissingFeatureEventData) {
  let data = [
    missingFeatureData.missingFeatures
  ];
  return data;
}

function xhrErrorToArray(xhrErrorData: IXhrErrorEventData) {
  let data = [
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

function byteLimitExceededToArray(byteLimitData: ITotalByteLimitExceededEventData) {
  let data = [
    byteLimitData.bytes
  ];
  return data;
}

function noDataToArray() {
  return null;
}

function assertFailedToArray(failedAssertData: IClarityAssertFailedEventData) {
  let data = [
    failedAssertData.source,
    failedAssertData.comment
  ];
  return data;
}

function clarityDuplicatedToArray(clarityDuplicatedData: IClarityDuplicatedEventData) {
  let data = [
    clarityDuplicatedData.currentImpressionId
  ];
  return data;
}

function clarityActivateErrorToArray(clarityActivateErrorData: IClarityActivateErrorEventData) {
  let data = [
    clarityActivateErrorData.error
  ];
  return data;
}

function inconsistentShadowDomToArray(inconsistentShadowDomData: IShadowDomInconsistentEventData) {
  let data = [
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
