let performanceConverters = [];
performanceConverters[PerformanceEventType.NavigationTiming] = navigationTimingToArray;
performanceConverters[PerformanceEventType.ResourceTiming] = resourceTimingsToArray;

export default performanceConverters;

function navigationTimingToArray(timing: IPerformanceNavigationTiming) {
  let timingArray = [timing.connectEnd,
    timing.connectStart,
    timing.domainLookupEnd,
    timing.domainLookupStart,
    timing.domComplete,
    timing.domContentLoadedEventEnd,
    timing.domContentLoadedEventStart,
    timing.domInteractive,
    timing.domLoading,
    timing.fetchStart,
    timing.loadEventEnd,
    timing.loadEventStart,
    timing.msFirstPaint,
    timing.navigationStart,
    timing.redirectEnd,
    timing.redirectStart,
    timing.requestStart,
    timing.responseEnd,
    timing.responseStart,
    timing.unloadEventEnd,
    timing.unloadEventStart,
    timing.secureConnectionStart
  ];
  let data = timingArray;
  return data;
}

function resourceTimingsToArray(entries: IPerformanceResourceTiming[]) {
  let entriesArray = [];
  for (let i = 0; i < entries.length; i++) {
    entriesArray.push(resourceTimingEntryToArray(entries[i]));
  }
  let data = entriesArray;
  return data;
}

function resourceTimingEntryToArray(resource: IPerformanceResourceTiming) {
  let data = [
    resource.duration,
    resource.initiatorType,
    resource.startTime,
    resource.connectStart,
    resource.connectEnd,
    resource.requestStart,
    resource.responseStart,
    resource.responseEnd,
    resource.name,
    "transferSize" in resource ? resource.transferSize : null,
    "encodedBodySize" in resource ? resource.encodedBodySize : null,
    "decodedBodySize" in resource ? resource.decodedBodySize : null
  ];
  return data;
}
