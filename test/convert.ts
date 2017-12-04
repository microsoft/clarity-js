import EventConverter from "../converters/fromarray/core";
import { MockEventName } from "./utils";

export default function(eventArray: IEventArray): IEvent {
  let type = eventArray[0];
  let event: IEvent = null;
  if (type === MockEventName) {
    event = mockEventFromArray(eventArray);
  } else {
    event = EventConverter(eventArray);
  }
  return event;
}

export function mockDataToArray(data: object): any[] {
  return [data];
}

export function mockDataFromArray(data: any[]): object {
  return data[0];
}

export function mockEventFromArray(eventArray: IEventArray): IEvent {
  let type = eventArray[0];
  let id   = eventArray[1];
  let time = eventArray[2];
  let data = mockDataFromArray(eventArray[3]);
  let event: IEvent = { type, id, time, data, converter: null };
  return event;
}
