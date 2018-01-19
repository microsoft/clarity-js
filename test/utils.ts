
import { ICompressedBatchMessage, IEnvelope, IEvent, IEventInfo, IImpressionMetadata,
  IPayload, IWorkerMessage } from "../declarations/clarity";
import { Origin, WorkerMessageType } from "../declarations/clarity";
import compress from "../src/compress";
import { addEvent, onWorkerMessage } from "../src/core";
import { guid } from "../src/utils";
import EventFromArray from "./fromarray";
import { getSentEvents, getWorkerMessages } from "./testsetup";
import EventToArray from "./toarray";

export function observeEvents(eventOrigin?: Origin): () => IEvent[] {
  let initialEventsLength = getSentEvents().length;
  let stopObserving = (): IEvent[] => {
    let newEvents = getSentEvents().slice(initialEventsLength);
    return eventOrigin ? getEventsByOrigin(newEvents, eventOrigin) : newEvents;
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

export function getEventsByOrigin(events: IEvent[], origin: Origin): IEvent[] {
  return events.filter((event) => event.origin === origin);
}

export function postCompressedBatch(events: IEvent[], envelope?: IEnvelope) {
  let eventArrays = events.map((e) => EventToArray(e));
  let mockNextBatch: string[] = [];
  for (let i = 0; i < eventArrays.length; i++) {
    mockNextBatch.push(JSON.stringify(eventArrays[i]));
  }
  envelope = envelope || getMockEnvelope();
  let mockRawData = `{"envelope":${JSON.stringify(envelope)},"events":[${mockNextBatch.join()}]}`;
  let mockCompressedData = compress(mockRawData);
  let mockCompressedBatchMessage: ICompressedBatchMessage = {
    type: WorkerMessageType.CompressedBatch,
    compressedData: mockCompressedData,
    rawData: mockRawData,
    eventCount: eventArrays.length
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

export function getMockEventInfo(data?: any): IEventInfo {
  let mockEvent: IEventInfo = {
    origin: TestConstants.MockOrigin,
    type: TestConstants.MockEventType,
    data: data || {},
    time: TestConstants.MockEventTime
  };
  return mockEvent;
}

export function getMockEvent(data?: any): IEvent {
  let mockEventInfo = getMockEventInfo(data);
  let mockEvent: IEvent = {
    id: -1,
    origin: mockEventInfo.origin,
    type: mockEventInfo.type,
    data: mockEventInfo.data,
    time: mockEventInfo.time
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
