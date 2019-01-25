import EventToArray from "../../src/converters/toarray";

import { IEvent, IEventArray } from "../../types/core";
import { MockEventName } from "./utils";

export default function(event: IEvent): IEventArray {
  let eventArray = null;
  if (event.type === MockEventName) {
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
