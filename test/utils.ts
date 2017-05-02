import { config } from "../src/config";
import * as core from "../src/core";
import uncompress from "../src/uncompress";
import { clearSentBytes, getSentBytes } from "./testsetup";

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
  this.result = fixture.load("clarity.fixture.html");
  jasmine.clock().install();
  activateCore();
}

export function cleanupFixture() {
  fixture.cleanup();
  core.teardown();
  jasmine.clock().uninstall();
}

export function triggerSend() {
  jasmine.clock().tick(config.delay * 2);
}

export function activateCore() {
  clearSentBytes();
  core.activate();
  triggerSend();
}

function getEventsFromSentBytes(sentBytes: string[]): IEvent[] {
  let events = [];
  for (let i = 0; i < sentBytes.length; i++) {
    let payload: IPayload = JSON.parse(uncompress(JSON.parse(sentBytes[i])));
    events = events.concat(payload.events);
  }
  return events;
}
