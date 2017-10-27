
import { ICompressedBatchMessage, IEnvelope, IEvent, IWorkerMessage, WorkerMessageType } from "../clarity";
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
    impressionId: guid(),
    sequenceNumber: sequenceNumber >= 0 ? sequenceNumber : -1,
    time: -1,
  };
  return mockEnvelope;
}

export function getMockMetadata() {
  let mockMetadata: IImpressionMetadata = {
    clarityId: guid(),
    impressionId: guid(),
    url: window.location.toString(),
    version: "0.0.0"
  };
  return mockMetadata;
}

export function getMockEvent(eventName?: string) {
  let mockEvent: IEvent = {
    id: -1,
    data: {},
    time: -1,
    type: eventName || MockEventName
  };
  return mockEvent;
}
