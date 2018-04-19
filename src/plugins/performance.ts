import { IPerformanceResourceTiming, IPlugin } from "../../clarity";
import { config } from "../config";
import { addEvent } from "../core";
import { mapProperties } from "../utils";

export default class PerformanceProfiler implements IPlugin {

  private readonly timeoutLength = 1000;

  private uploadHyperlink = document.createElement("a");
  private lastInspectedEntryIndex: number;
  private logTimingTimeout: number;
  private logResourceTimingTimeout: number;

  // For performance reasons this module relies on the fact that array returned from the
  // getEntries function is a superset of the array returned from that function on previous inspection.
  // If that is not the case (e.g. performance.clearResourceTimings() was used), then
  // some entries may be missed and consistency is not guaranteed.
  // Set this flag to 'true' if we detect that something went wrong (e.g. new array length < lastInspectedEntryIndex)
  private stateError = false;

  // IE has a very 'unique' way of working with performance entries
  // Each time you invoke getEntries() it returns a list of brand new objects,
  // even if those objects describe the same network entries, but at least it maintains the order.
  // Besides that, IE returns performance entries for resources that are not finished loading yet,
  // so duration, responseEnd and other values can be '0' until you re-inspect getEntries() later.
  // To be able to come back to those incomplete entries, we will store their indices for revisiting.
  private incompleteEntryIndices: number[] = [];

  private timing: PerformanceTiming;
  private getEntriesByType: (type: string) => PerformanceEntry[];

  public activate() {
    if (this.timing) {
      this.logTimingTimeout = setTimeout(this.logTiming.bind(this), this.timeoutLength);
    }
    if (this.getEntriesByType) {
      this.logResourceTimingTimeout = setTimeout(this.logResourceTiming.bind(this), this.timeoutLength);
    }
  }

  public reset(): void {
    this.lastInspectedEntryIndex = -1;
    this.stateError = false;
    this.incompleteEntryIndices = [];

    if (config.uploadUrl.length > 0) {
      this.uploadHyperlink.href = config.uploadUrl;
    }

    // Potentially these don't need resets because performance object doesn't normally change within the page
    // The reason for resetting these values on each activation is for easier testing
    // This way this component would pick up a dummy performance object for reliable unit testing
    this.timing = window.performance && performance.timing;
    this.getEntriesByType = window.performance
      && typeof performance.getEntriesByType === "function"
      && performance.getEntriesByType.bind(performance);
  }

  public teardown() {
    clearTimeout(this.logTimingTimeout);
    clearTimeout(this.logResourceTimingTimeout);
  }

  private logTiming() {
    if (this.timing.loadEventEnd > 0) {
      let formattedTiming = this.timing.toJSON ? this.timing.toJSON() : this.timing;
      formattedTiming = mapProperties(formattedTiming, (name: string, value) => {
        return (formattedTiming[name] === 0) ? 0 : Math.round(formattedTiming[name] - formattedTiming.navigationStart);
      }, false);
      let navigationTimingEventState = {
        timing: formattedTiming
      };
      addEvent({type: "NavigationTiming", state: navigationTimingEventState});
    } else {
      this.logTimingTimeout = setTimeout(this.logTiming.bind(this), this.timeoutLength);
    }
  }

  private logResourceTiming() {
    let entries = this.getEntriesByType("resource");

    // If entries.length < lastInspectedEntry + 1, most likely some entries have
    // been cleared, which would cause inconsistencies in further entries inspection.
    // In case this happens, log an error once and reset the module to its initial state
    if (entries.length < this.lastInspectedEntryIndex + 1) {
      if (!this.stateError) {
        this.stateError = true;
        addEvent({type: "PerformanceStateError", state: {}});
      }

      this.lastInspectedEntryIndex = -1;
      this.incompleteEntryIndices = [];
    }

    let entryInfos = [];
    let incompleteEntryIndicesCopy = this.incompleteEntryIndices.slice();

    this.incompleteEntryIndices = [];

    // First, revisit the entries that were identified as incomplete upon last inspection
    for (let i = 0; i < incompleteEntryIndicesCopy.length; i++) {
      let entryIndex = incompleteEntryIndicesCopy[i];
      let networkData = this.inspectEntry(entries[entryIndex], entryIndex);
      if (networkData) {
        entryInfos.push(networkData);
      }
    }

    // Then, inspect fresh entries
    for (let i = this.lastInspectedEntryIndex + 1; i < entries.length; i++) {
      let networkData = this.inspectEntry(entries[i], i);
      if (networkData) {
        entryInfos.push(networkData);
      }
      this.lastInspectedEntryIndex = i;
    }

    if (entryInfos.length > 0) {
      let resourceTimingEventState = {
        entries: entryInfos
      };
      addEvent({type: "ResourceTiming", state: resourceTimingEventState});
    }

    this.logResourceTimingTimeout = setTimeout(this.logResourceTiming.bind(this), this.timeoutLength);
  }

  private inspectEntry(entry, entryIndex): object {
    let networkData: IPerformanceResourceTiming = null;
    if (entry && entry.responseEnd > 0) {

      // Ignore Clarity's own network upload requests to avoid infinite loop of network reporting
      if (entry.name !== this.uploadHyperlink.href) {
        networkData = {
          duration: entry.duration,
          initiatorType: entry.initiatorType,
          startTime: entry.startTime,
          connectStart: entry.connectStart,
          connectEnd: entry.connectEnd,
          requestStart: entry.requestStart,
          responseStart: entry.responseStart,
          responseEnd: entry.responseEnd,
          name: entry.name
        };

        // These properties only exist in new browsers
        // They also don't need rounding, because they are measured in bytes
        if ("transferSize" in entry) {
          networkData.transferSize = entry.transferSize;
        }
        if ("encodedBodySize" in entry) {
          networkData.encodedBodySize = entry.encodedBodySize;
        }
        if ("decodedBodySize" in entry) {
          networkData.decodedBodySize = entry.decodedBodySize;
        }

        networkData = mapProperties(networkData, (name: string, value) => {
          return (typeof value === "number") ? Math.round(value) : value;
        }, true) as IPerformanceResourceTiming;
      }
    } else {
      this.incompleteEntryIndices.push(entryIndex);
    }

    return networkData;
  }
}
