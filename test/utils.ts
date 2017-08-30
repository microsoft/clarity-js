import { start, stop } from "../src/clarity";
import { config } from "../src/config";
import { addEvent, forceUpload } from "../src/core";
import { mapProperties } from "../src/utils";
import { clearSentEvents, getSentEvents, onWorkerMessage, testConfig } from "./testsetup";
import uncompress from "./uncompress";

export const MockEventName = "ClarityTestMockEvent";

let originalConfig: IConfig = config;

export function triggerMockEvent(eventName?: string) {
  eventName = eventName || MockEventName;
  addEvent({type: eventName, state: {}});
}

export function observeEvents(eventType?: string): () => IEvent[] {
  let initialEventsLength = getSentEvents().length;
  let stopObserving = (): IEvent[] => {
    let newEvents = getSentEvents().slice(initialEventsLength);
    return eventType ? getEventsByType(newEvents, eventType) : newEvents;
  };
  return stopObserving;
}

export function getEventsByType(events: IEvent[], eventType: string): IEvent[] {
  function checkEventType(event: IEvent): boolean {
    return (event.type === eventType);
  }
  return getEventsByCustomCondition(events, checkEventType);
}

export function getEventsByCustomCondition(events: IEvent[], conditionFunction: (event: IEvent) => boolean): IEvent[] {
  let matchingEvents: IEvent[] = [];
  for (let i = 0; i < events.length; i++) {
    if (conditionFunction(events[i])) {
      matchingEvents.push(events[i]);
    }
  }
  return matchingEvents;
}

export function getAllSentEvents() {
  return getSentEvents();
}

export function setupFixture(plugins?: string[]) {
  fixture.setBase("test");
  fixture.load("clarity.fixture.html");
  jasmine.clock().install();

  spyOn(Worker.prototype, "postMessage").and.callFake(onWorkerMessage);
  testConfig.plugins = plugins || config.plugins;
  activateCore(testConfig);
}

export function cleanupFixture() {
  fixture.cleanup();
  stop();
  resetConfig();
  jasmine.clock().uninstall();
}

export function activateCore(config?: IConfig) {
  clearSentEvents();
  start(config);
  waitForStartupAcvitityToFinish();
}

export function resetConfig() {
  mapProperties(originalConfig, null, true, config);
}

function waitForStartupAcvitityToFinish() {
  let currentEventsLength = getSentEvents().length;
  let hasNewEvents = true;
  while (hasNewEvents) {
    jasmine.clock().tick(config.delay * 2);
    let newSentEventsLength = getSentEvents().length;
    hasNewEvents = newSentEventsLength > currentEventsLength;
    currentEventsLength = newSentEventsLength;
  }
}
