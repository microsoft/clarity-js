// import { config } from "../../src/config";
// import { cleanupFixture, getSentEvents, setupFixture } from "../setup/testsetup";
// import { getEventsByType, observeEvents } from "../setup/utils";

// import * as chai from "chai";
// import { ResourceTimingEventType } from "../../src/plugins/performance";

// let assert = chai.assert;
// let resourceTimingEventName = "ResourceTiming";
// let stateErrorEventName = "PerformanceStateError";
// let navigationTimingEventName = "NavigationTiming";
// let performancePollTimeoutLength = 1000;

// describe("Performance Tests", () => {
//   let originalPerformance: Performance;
//   let dummyPerformance;
//   let dummyResourceTimings;

//   beforeEach(() => {
//     resetDummies();
//     originalPerformance = window.performance;
//     setWindowProperty("performance", dummyPerformance);
//     setupFixture(["performance"]);
//   });

//   afterEach(() => {
//     setWindowProperty("performance", originalPerformance);
//     cleanupFixture();
//   });

//   it("checks that w3c performance timing is logged by clarity", (done: DoneFn) => {
//     // Timings are checked in an interval, so it needs additional time to re-invoke the check
//     fastForwardToNextPerformancePoll();
//     let events = getEventsByType(getSentEvents(), navigationTimingEventName);
//     assert.equal(events.length, 1);

//     let timing = events[0].state && events[0].state.timing;
//     assert.equal(!!timing, true);
//     assert.equal(timing.dummyResponseEnd, dummyPerformance.timing.dummyResponseEnd);

//     done();
//   });

//   it("checks that network resource timings are logged by clarity", (done: DoneFn) => {
//     let stopObserving = observeEvents(resourceTimingEventName);
//     let dummyEntry = { initiatorType: "dummy", responseEnd: 1 };
//     dummyResourceTimings.push(dummyEntry);
//     fastForwardToNextPerformancePoll();

//     let events = stopObserving();
//     assert.equal(events.length, 1);
//     assert.equal(events[0].type, ResourceTimingEventType);
//     assert.equal(events[0].state.initiatorType, dummyEntry.initiatorType);
//     done();
//   });

//   it("checks that error is logged when entries are cleared", (done: DoneFn) => {
//     let stopObserving = observeEvents(resourceTimingEventName);
//     dummyResourceTimings.push({ responseEnd: 1 });
//     fastForwardToNextPerformancePoll();

//     let events = stopObserving();
//     assert.equal(events.length, 1);

//     stopObserving = observeEvents(stateErrorEventName);
//     dummyResourceTimings = [];
//     fastForwardToNextPerformancePoll();

//     events = stopObserving();
//     assert.equal(events.length, 1);

//     done();
//   });

//   it("checks that incomplete entries are not logged initially, but then revisited", (done: DoneFn) => {
//     let completeEntry = { responseEnd: 1, initiatorType: "completeEntry" };
//     let incompleteEntry = { responseEnd: 0, initiatorType: "incompleteEntry" };
//     let stopObserving = observeEvents(resourceTimingEventName);
//     dummyResourceTimings.push(completeEntry);
//     dummyResourceTimings.push(incompleteEntry);
//     fastForwardToNextPerformancePoll();

//     let events = stopObserving();
//     assert.equal(events.length, 1);

//     assert.equal(events.length, 1);
//     assert.equal(events[0].type, ResourceTimingEventType);
//     assert.equal(events[0].state.initiatorType, "completeEntry");

//     // Adjust the entry to have a valid response end time and wait for snapshot to propagate
//     stopObserving = observeEvents(resourceTimingEventName);
//     incompleteEntry.responseEnd = 1;
//     fastForwardToNextPerformancePoll();

//     events = stopObserving();
//     assert.equal(events.length, 1);

//     assert.equal(events.length, 1);
//     assert.equal(events[0].type, ResourceTimingEventType);
//     assert.equal(events[0].state.initiatorType, "incompleteEntry");

//     done();
//   });

//   it("checks that network resource timings blacklisted in config are ignored", (done: DoneFn) => {
//     let stopObserving = observeEvents(resourceTimingEventName);
//     let blacklistedUrl = "https://www.clarity.blacklisted.url";
//     let dummyEntry = { name: blacklistedUrl };
//     config.urlBlacklist = [ blacklistedUrl ];

//     dummyResourceTimings.push(dummyEntry);
//     fastForwardToNextPerformancePoll();

//     let events = stopObserving();
//     assert.equal(events.length, 0);
//     done();
//   });

//   // Workaround the fact that compiler doesn't allow window.performance = value,
//   // because it thinks that it is an immutable property (it's not)
//   function setWindowProperty(property: string, value) {
//     window[property] = value;
//   }

//   function dummyGetEntriesByType() {
//     return dummyResourceTimings;
//   }

//   function resetDummies() {
//     dummyPerformance = {
//       timing: {
//         loadEventEnd: 1,
//         dummyResponseEnd: -1,
//         navigationStart: 0,
//       },
//       getEntriesByType: dummyGetEntriesByType
//     };
//     dummyResourceTimings = [];
//   }

//   function fastForwardToNextPerformancePoll() {
//     jasmine.clock().tick(performancePollTimeoutLength + 1);
//   }
// });
