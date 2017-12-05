let instrumentationConverters = [];
instrumentationConverters[Instrumentation.JsError] = jsErrorFromArray;
instrumentationConverters[Instrumentation.MissingFeature] = missingFeatureFromArray;
instrumentationConverters[Instrumentation.XhrError] = xhrErrorFromArray;
instrumentationConverters[Instrumentation.TotalByteLimitExceeded] = byteLimitExceededFromArray;
instrumentationConverters[Instrumentation.Teardown] = noDataFromArray;
instrumentationConverters[Instrumentation.PerformanceStateError] = noDataFromArray;
instrumentationConverters[Instrumentation.ClarityAssertFailed] = assertFailedFromArray;
instrumentationConverters[Instrumentation.ClarityDuplicated] = clarityDuplicatedFromArray;
instrumentationConverters[Instrumentation.ClarityActivateError] = clarityActivateErrorFromArray;
instrumentationConverters[Instrumentation.ShadowDomInconsistent] = inconsistentShadowDomFromArray;

export default instrumentationConverters;

function jsErrorFromArray(jsErrorData: any[]): IJsErrorEventData {
  let data: IJsErrorEventData = {
    source  : jsErrorData[0],
    message : jsErrorData[1],
    stack   : jsErrorData[2],
    lineno  : jsErrorData[3],
    colno   : jsErrorData[4]
  };
  return data;
}

function missingFeatureFromArray(missingFeatureData: any[]): IMissingFeatureEventData {
  let data: IMissingFeatureEventData = {
    missingFeatures : missingFeatureData[0]
  };
  return data;
}

function xhrErrorFromArray(xhrErrorData: any[]): IXhrErrorEventData {
  let data: IXhrErrorEventData = {
    requestStatus     : xhrErrorData[0],
    sequenceNumber    : xhrErrorData[1],
    compressedLength  : xhrErrorData[2],
    rawLength         : xhrErrorData[3],
    firstEventId      : xhrErrorData[4],
    lastEventId       : xhrErrorData[5],
    attemptNumber     : xhrErrorData[6]
  };
  return data;
}

function byteLimitExceededFromArray(byteLimitData: any[]): ITotalByteLimitExceededEventData {
  let data: ITotalByteLimitExceededEventData = {
    bytes : byteLimitData[0]
  };
  return data;
}

function noDataFromArray() {
  return null;
}

function assertFailedFromArray(failedAssertData: any[]): IClarityAssertFailedEventData {
  let data: IClarityAssertFailedEventData = {
    source  : failedAssertData[0],
    comment : failedAssertData[1]
  };
  return data;
}

function clarityDuplicatedFromArray(clarityDuplicatedData: any[]): IClarityDuplicatedEventData {
  let data: IClarityDuplicatedEventData = {
    currentImpressionId : clarityDuplicatedData[0]
  };
  return data;
}

function clarityActivateErrorFromArray(clarityActivateErrorData: any[]): IClarityActivateErrorEventData {
  let data: IClarityActivateErrorEventData = {
    error : clarityActivateErrorData[0]
  };
  return data;
}

function inconsistentShadowDomFromArray(inconsistentShadowDomData: any[]): IShadowDomInconsistentEventData {
  let data: IShadowDomInconsistentEventData = {
    dom                     : inconsistentShadowDomData[0],
    shadowDom               : inconsistentShadowDomData[1],
    lastConsistentShadowDom : inconsistentShadowDomData[2],
    lastAction              : inconsistentShadowDomData[3]
  };
  if (inconsistentShadowDomData[5] != null) {
    data.firstEvent = inconsistentShadowDomData[4];
  }
  return data;
}
