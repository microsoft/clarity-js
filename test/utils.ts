import { start, stop } from "../src/clarity";
import { config } from "../src/config";
import { addEvent } from "../src/core";
import { mapProperties } from "../src/utils";
import { clearSentBytes, getSentBytes } from "./testsetup";
import uncompress from "./uncompress";

export const MockEventName = "ClarityTestMockEvent";

let originalConfig: IConfig = config;

export function triggerMockEvent(eventName?: string) {
  eventName = eventName || MockEventName;
  addEvent({type: eventName, state: {}});
  triggerSend();
}

export function observeEvents(eventType?: string): () => IEvent[] {
  triggerSend();
  let initialSentBytesLength = getSentBytes().length;
  let stopObserving = (): IEvent[] => {
    triggerSend();
    let newEvents = getEventsFromSentBytes(getSentBytes().slice(initialSentBytesLength));
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

export function getAllSentEvents(): IEvent[] {
  return getEventsFromSentBytes(getSentBytes());
}

export function getAllSentBytes() {
  return getSentBytes();
}

export function setupFixture() {
  fixture.setBase("test");
  fixture.load("clarity.fixture.html");
  jasmine.clock().install();
  originalConfig = mapProperties(config, null, true);
  activateCore();
}

export function cleanupFixture() {
  fixture.cleanup();
  stop();
  jasmine.clock().uninstall();
  resetConfig();
}

export function triggerSend() {
  jasmine.clock().tick(config.delay * 2);
}

export function activateCore() {
  clearSentBytes();
  start();
  triggerSend();
}

export function resetConfig() {
  mapProperties(originalConfig, null, true, config);
}

function getEventsFromSentBytes(sentBytes: string[]): IEvent[] {
  let events = [];
  for (let i = 0; i < sentBytes.length; i++) {
    let payload: IPayload = JSON.parse(uncompress(JSON.parse(sentBytes[i])));
    events = events.concat(payload.events);
  }
  return events;
}
