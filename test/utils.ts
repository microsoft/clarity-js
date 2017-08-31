
import compress from "../src/compress";
import { addEvent, onWorkerMessage } from "../src/core";
import { guid } from "../src/utils";
import { getSentEvents } from "./testsetup";

export const MockEventName = "ClarityTestMockEvent";

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

export function uploadEvents(events: IEvent[], envelope?: IEnvelope) {
  let mockNextPayload: string[] = [];
  for (let i = 0; i < events.length; i++) {
    mockNextPayload.push(JSON.stringify(events[i]));
  }
  envelope = envelope || getMockEnvelope();
  let mockRawData = `{"envelope":${JSON.stringify(envelope)},"events":[${mockNextPayload.join()}]}`;
  let mockCompressedData = compress(mockRawData);
  let mockUploadMessage: IUploadMessage = {
    type: WorkerMessageType.Upload,
    compressedData: mockCompressedData,
    rawData: mockRawData
  };
  let mockUploadMessageEvent = {
    data: JSON.stringify(mockUploadMessage)
  } as MessageEvent;
  onWorkerMessage(mockUploadMessageEvent);
}

export function getMockEnvelope(sequenceNumber?: number) {
  let mockEnvelope: IEnvelope = {
    clarityId: guid(),
    impressionId: guid(),
    sequenceNumber: sequenceNumber >= 0 ? sequenceNumber : -1,
    time: new Date().getTime(),
    url: window.location.toString(),
    version: "0.0.0"
  };
  return mockEnvelope;
}

export function getMockEvent(eventName?: string) {
  let mockEvent: IEvent = {
    id: -1,
    state: {},
    time: new Date().getTime(),
    type: eventName || MockEventName
  };
  return mockEvent;
}
