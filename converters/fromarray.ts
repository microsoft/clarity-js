import { IDiscoverInsert, IEvent, IEventArray, ILayoutState } from "../declarations/clarity";
import { Action, ObjectType, Origin } from "../declarations/clarity";
import { SchemaManager } from "./schema";

let schemas = new SchemaManager();

export default function(eventArray: IEventArray): IEvent {
  let id        = eventArray[0];
  let origin    = eventArray[1];
  let type      = eventArray[2];
  let time      = eventArray[3];
  let dataArray = eventArray[4];
  let schema    = eventArray[5];

  if (typeof schema === "string") {
    schema = schemas.getSchema(schema);
  } else {
    schemas.addSchema(schema);
  }

  let data = dataFromArray(dataArray, schema as any[]);
  let event: IEvent = { origin, type, id, time, data };
  return event;
}

export function eventsFromDiscoverArray(
  id: number, time: number, data: any[], index: number, parent: ILayoutState = null, previous: ILayoutState = null
): IEvent[] {
  // Next element hasn't been parsed yet at this point, so we don't know its index
  let nextIndex = null;
  let previousIndex = previous ? previous.index : null;
  let parentIndex = parent ? parent.index : null;
  let children = data[data.length - 1];
  let schema = data[0];
  let partialStateData = data[1];

  if (typeof schema === "string") {
    schema = schemas.getSchema(schema);
  } else {
    schemas.addSchema(schema);
  }

  let layoutState = dataFromArray(partialStateData, schema) as ILayoutState;
  layoutState.index = index;
  layoutState.parent = parentIndex;
  layoutState.previous = previousIndex;
  layoutState.next = nextIndex;

  // Generate layouts in the same order as they were indexed on the client - DFS order
  let thisEventData: IDiscoverInsert = {
    action: Action.Discover,
    index,
    time,
    state: layoutState
  };
  let thisEvent: IEvent = {
    id,
    origin: Origin.Layout,
    type: Action.Discover,
    time,
    data: thisEventData
  };

  if (previous) {
    previous.next = index;
  }
  index++;

  let events = [ thisEvent ];
  let previousChildState: ILayoutState = null;
  for (let i = 0; i < children.length; i++) {
    let nextChildEvents = eventsFromDiscoverArray(id, time, children[i], index, thisEvent.data.state, previousChildState);
    previousChildState = nextChildEvents[0].data.state;
    index += nextChildEvents.length;
    events = events.concat(nextChildEvents);
  }

  return events;
}

function dataFromArray(dataArray: any[], schema: any[]): any {
  if (typeof schema === "string" || schema === null) {
    return dataArray;
  }

  let data = null;
  let dataType = null;
  let subschemas = null;
  if (schema.length === 2) {
    dataType = schema[0];
    subschemas = schema[1];
  } else if (schema.length === 3) {
    dataType = schema[1];
    subschemas = schema[2];
  }

  if (dataType === ObjectType.Object) {
    data = {};
    for (let i = 0; i < subschemas.length; i++) {
      let nextSubschema = subschemas[i];
      let nextProperty = null;
      if (typeof nextSubschema === "string") {
        nextProperty = nextSubschema;
      } else {
        nextProperty = nextSubschema[0];
      }
      data[nextProperty] = dataFromArray(dataArray[i], nextSubschema);
    }
  } else if (dataType === ObjectType.Array) {
    data = [];
    for (let i = 0; i < subschemas.length; i++) {
      let nextSubschema = subschemas[i];
      data.push(dataFromArray(dataArray[i], nextSubschema));
    }
  }
  return data;
}
