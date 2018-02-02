
import { ICompressedBatchMessage, IEnvelope, IEvent, IPayload, IWorkerMessage, WorkerMessageType } from "../clarity";
import compress from "../src/compress";
import { addEvent, onWorkerMessage } from "../src/core";
import { guid } from "../src/utils";
import EventFromArray from "./fromarray";
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

export function postCompressedBatch(events: IEvent[], envelope?: IEnvelope) {
  let mockNextBatch: string[] = [];
  for (let i = 0; i < events.length; i++) {
    mockNextBatch.push(JSON.stringify(events[i]));
  }
  envelope = envelope || getMockEnvelope();
  let mockRawData = `{"envelope":${JSON.stringify(envelope)},"events":[${mockNextBatch.join()}]}`;
  let mockCompressedData = compress(mockRawData);
  let mockCompressedBatchMessage: ICompressedBatchMessage = {
    type: WorkerMessageType.CompressedBatch,
    compressedData: mockCompressedData,
    rawData: mockRawData,
    eventCount: events.length
  };
  let mockCompressedBatchMessageEvent = {
    data: mockCompressedBatchMessage
  } as MessageEvent;
  onWorkerMessage(mockCompressedBatchMessageEvent);
}

export function getMockEnvelope(sequenceNumber?: number) {
  let mockEnvelope: IEnvelope = {
    clarityId: guid(),
    impressionId: guid(),
    sequenceNumber: sequenceNumber >= 0 ? sequenceNumber : -1,
    time: -1,
    url: window.location.toString(),
    version: "0.0.0"
  };
  return mockEnvelope;
}

export function getMockEvent(eventName?: string) {
  let mockEvent: IEvent = {
    id: -1,
    state: {},
    time: -1,
    type: eventName || MockEventName
  };
  return mockEvent;
}

export function payloadToEvents(payload: IPayload): IEvent[] {
  let eventArrays = payload.events;
  let events: IEvent[] = [];
  for (let i = 0; i < eventArrays.length; i++) {
    let event = EventFromArray(eventArrays[i]);
    events.push(event);
  }
  return events;
}
