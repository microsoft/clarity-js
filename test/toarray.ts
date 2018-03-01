import { IEvent, IEventArray } from "../clarity";
import EventToArray from "../converters/toarray";
import { MockEventType } from "./utils";

export default function(event: IEvent): IEventArray {
  let eventArray = null;
  if (event.type === MockEventType) {
    eventArray = mockEventToArray(event);
  } else {
    eventArray = EventToArray(event);
  }
  return eventArray;
}

function mockEventToArray(event: IEvent) {
  let data: IEventArray = [
    event.id,
    event.type,
    event.time,
    mockDataToArray(event.state),
    null
  ];
  return data;
}

function mockDataToArray(data: object): any[] {
  return [data];
}
