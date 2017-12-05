
let performanceConverters = [];
performanceConverters[PerformanceEventType.NavigationTiming] = navigationTimingFromArray;
performanceConverters[PerformanceEventType.ResourceTiming] = resourceTimingsFromArray;

export default performanceConverters;

function navigationTimingFromArray(timing: any[]): IPerformanceNavigationTiming {
  let data: IPerformanceNavigationTiming = {
    connectEnd                  : timing[0],
    connectStart                : timing[1],
    domainLookupEnd             : timing[2],
    domainLookupStart           : timing[3],
    domComplete                 : timing[4],
    domContentLoadedEventEnd    : timing[5],
    domContentLoadedEventStart  : timing[6],
    domInteractive              : timing[7],
    domLoading                  : timing[8],
    fetchStart                  : timing[9],
    loadEventEnd                : timing[10],
    loadEventStart              : timing[11],
    msFirstPaint                : timing[12],
    navigationStart             : timing[13],
    redirectEnd                 : timing[14],
    redirectStart               : timing[15],
    requestStart                : timing[16],
    responseEnd                 : timing[17],
    responseStart               : timing[18],
    unloadEventEnd              : timing[19],
    unloadEventStart            : timing[20],
    secureConnectionStart       : timing[21]
  };
  return data;
}

function resourceTimingsFromArray(resourceTimings: any[][]): IPerformanceResourceTiming[] {
  let entries: IPerformanceResourceTiming[] = [];
  for (let i = 0; i < resourceTimings.length; i++) {
    entries.push(resourceTimingEntryFromArray(resourceTimings[i]));
  }
  return entries;
}

function resourceTimingEntryFromArray(resource: any[]): IPerformanceResourceTiming {
  let data: IPerformanceResourceTiming = {
    duration        : resource[0],
    initiatorType   : resource[1],
    startTime       : resource[2],
    connectStart    : resource[3],
    connectEnd      : resource[4],
    requestStart    : resource[5],
    responseStart   : resource[6],
    responseEnd     : resource[7],
    name            : resource[8]
  };
  if (resource[9] != null) {
    data.transferSize = resource[9];
  }
  if (resource[10] != null) {
    data.encodedBodySize = resource[10];
  }
  if (resource[11] != null) {
    data.decodedBodySize = resource[11];
  }
  return data;
}
