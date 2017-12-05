import EventFromArray from "../converters/fromarray/convert";

export default function(eventArray: IEventArray): IEvent {
  let origin = eventArray[0];
  let event: IEvent = null;
  if (origin === TestConstants.MockOrigin) {
    event = mockEventFromArray(eventArray);
  } else {
    event = EventFromArray(eventArray);
  }
  return event;
}

function mockEventFromArray(eventArray: IEventArray): IEvent {
  let id      = eventArray[0];
  let origin  = eventArray[1];
  let type    = eventArray[2];
  let time    = eventArray[3];
  let data    = mockDataFromArray(eventArray[4]);
  let event: IEvent = { id, origin, type, time, data };
  return event;
}

function mockDataFromArray(data: any[]): object {
  return data[0];
}
