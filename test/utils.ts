
import compress from "../src/compress";
import { addEvent, onWorkerMessage } from "../src/core";
import { guid } from "../src/utils";
import { getSentEvents, getWorkerMessages } from "./testsetup";

export const MockEventName = "ClarityTestMockEvent";

export function observeEvents(eventType?: string): () => IEvent[] {
  let initialEventsLength = getSentEvents().length;
  let stopObserving = (): IEvent[] => {
    let newEvents = getSentEvents().slice(initialEventsLength);
    return eventType ? getEventsByType(newEvents, eventType) : newEvents;
  };
  return stopObserving;
}

export function observeWorkerMessages() {
  let initialEventsLength = getWorkerMessages().length;
  let stopObserving = (): IWorkerMessage[] => {
    let newMessages = getWorkerMessages().slice(initialEventsLength);
    return newMessages;
  };
  return stopObserving;
}

export function getEventsByType(events: IEvent[], eventType: string): IEvent[] {
  return events.filter((event) => event.type === eventType);
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
    rawData: mockRawData,
    eventCount: events.length
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
