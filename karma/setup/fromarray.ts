import EventFromArray from "../../src/converters/fromarray";
import { IEvent, IEventArray } from "../../types/index";
import { MockEventName } from "./utils";

export default function(eventArray: IEventArray): IEvent {
  let type = eventArray[1];
  let event: IEvent = null;
  if (type === MockEventName) {
    event = mockEventFromArray(eventArray);
  } else {
    event = EventFromArray(eventArray);
  }
  return event;
}

function mockEventFromArray(eventArray: IEventArray): IEvent {
  let id    = eventArray[0];
  let type  = eventArray[1];
  let time  = eventArray[2];
  let state = mockDataFromArray(eventArray[3]);
  let event: IEvent = { id, type, time, state };
  return event;
}

function mockDataFromArray(data: any[]): object {
  return data[0];
}
