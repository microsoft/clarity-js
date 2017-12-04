import { attributeUpdateFromArray } from "./layout";

export default function(instrumentationData: any[]): IInstrumentationEventData {
  let data: IInstrumentationEventData = instrumentationFromArray(instrumentationData);
  switch (data.type) {
    case Instrumentation.JsError:
      data = jsErrorFromArray(instrumentationData);
      break;
    case Instrumentation.MissingFeature:
      data = missingFeatureFromArray(instrumentationData);
      break;
    case Instrumentation.XhrError:
      data = xhrErrorFromArray(instrumentationData);
      break;
    case Instrumentation.TotalByteLimitExceeded:
      data = byteLimitExceededFromArray(instrumentationData);
      break;
    case Instrumentation.Teardown:
      // No extra properties. Keep data as is.
      break;
    case Instrumentation.ClarityAssertFailed:
      data = assertFailedFromArray(instrumentationData);
      break;
    case Instrumentation.ClarityDuplicated:
      data = clarityDuplicatedFromArray(instrumentationData);
      break;
    case Instrumentation.ShadowDomInconsistent:
      data = inconsistentShadowDomFromArray(instrumentationData);
      break;
    case Instrumentation.ClarityActivateError:
      data = clarityActivateErrorFromArray(instrumentationData);
      break;
    case Instrumentation.PerformanceStateError:
      // No extra properties. Keep data as is.
      break;
    default:
      console.warn("Unknown instrumentation type: " + data.type);
      break;
  }
  return data;
}

export function instrumentationFromArray(instrumentationData: any[]): IInstrumentationEventData {
  let data: IInstrumentationEventData = {
    type: instrumentationData[0]
  };
  return data;
}

export function jsErrorFromArray(jsErrorData: any[]): IJsErrorEventData {
  let data: IJsErrorEventData = {
    type    : jsErrorData[0],
    source  : jsErrorData[1],
    message : jsErrorData[2],
    stack   : jsErrorData[3],
    lineno  : jsErrorData[4],
    colno   : jsErrorData[5]
  };
  return data;
}

export function missingFeatureFromArray(missingFeatureData: any[]): IMissingFeatureEventData {
  let data: IMissingFeatureEventData = {
    type            : missingFeatureData[0],
    missingFeatures : missingFeatureData[1]
  };
  return data;
}

export function xhrErrorFromArray(xhrErrorData: any[]): IXhrErrorEventData {
  let data: IXhrErrorEventData = {
    type              : xhrErrorData[0],
    requestStatus     : xhrErrorData[1],
    sequenceNumber    : xhrErrorData[2],
    compressedLength  : xhrErrorData[3],
    rawLength         : xhrErrorData[4],
    firstEventId      : xhrErrorData[5],
    lastEventId       : xhrErrorData[6],
    attemptNumber     : xhrErrorData[7]
  };
  return data;
}

export function byteLimitExceededFromArray(byteLimitData: any[]): ITotalByteLimitExceededEventData {
  let data: ITotalByteLimitExceededEventData = {
    type  : byteLimitData[0],
    bytes : byteLimitData[1]
  };
  return data;
}

export function assertFailedFromArray(failedAssertData: any[]): IClarityAssertFailedEventData {
  let data: IClarityAssertFailedEventData = {
    type    : failedAssertData[0],
    source  : failedAssertData[1],
    comment : failedAssertData[2]
  };
  return data;
}

export function clarityDuplicatedFromArray(clarityDuplicatedData: any[]): IClarityDuplicatedEventData {
  let data: IClarityDuplicatedEventData = {
    type                : clarityDuplicatedData[0],
    currentImpressionId : clarityDuplicatedData[1]
  };
  return data;
}

export function inconsistentShadowDomFromArray(inconsistentShadowDomData: any[]): IShadowDomInconsistentEventData {
  let data: IShadowDomInconsistentEventData = {
    type                    : inconsistentShadowDomData[0],
    dom                     : inconsistentShadowDomData[1],
    shadowDom               : inconsistentShadowDomData[2],
    lastConsistentShadowDom : inconsistentShadowDomData[3],
    lastAction              : inconsistentShadowDomData[4]
  };
  if (inconsistentShadowDomData[5] != null) {
    data.firstEvent = inconsistentShadowDomData[5];
  }
  return data;
}

export function clarityActivateErrorFromArray(clarityActivateErrorData: any[]): IClarityActivateErrorEventData {
  let data: IClarityActivateErrorEventData = {
    type  : clarityActivateErrorData[0],
    error : clarityActivateErrorData[1]
  };
  return data;
}
