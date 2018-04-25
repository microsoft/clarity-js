import { Action, IEvent, ILayoutState, Source } from "../clarity";
import { dataFromArray } from "./fromarray";
import { SchemaManager } from "./schema";
import defaultSchemas from "./schema";

export { DiscoverEventName } from "./discoverclient";

export function eventsFromDiscoverArray(
  id: number, time: number, data: any[], index: number, schemas: SchemaManager, parent: ILayoutState = null, previous: ILayoutState = null
): IEvent[] {
  // Next element hasn't been parsed yet at this point, so we don't know its index
  let nextIndex = null;
  let previousIndex = previous ? previous.index : null;
  let parentIndex = parent ? parent.index : null;
  let children = data[data.length - 1];
  let schema = data[0];
  let partialStateData = data[1];

  if (!schemas) {
    schemas = defaultSchemas;
  }

  if (typeof schema === "number") {
    schema = schemas.getSchema(schema);
  } else {
    schemas.addSchema(schema);
  }

  let layoutState = dataFromArray(partialStateData, schema) as ILayoutState;
  layoutState.index = index;
  layoutState.parent = parentIndex;
  layoutState.previous = previousIndex;
  layoutState.next = nextIndex;
  layoutState.action = Action.Insert;
  layoutState.source = Source.Discover;

  let thisEvent: IEvent = {
    id,
    type: "Layout",
    time,
    state: layoutState
  };

  if (previous) {
    previous.next = index;
  }
  index++;

  let events = [ thisEvent ];
  let previousChildState: ILayoutState = null;
  for (let i = 0; i < children.length; i++) {
    let nextChildEvents = eventsFromDiscoverArray(id, time, children[i], index, schemas, thisEvent.state, previousChildState);
    previousChildState = nextChildEvents[0].state;
    index += nextChildEvents.length;
    events = events.concat(nextChildEvents);
  }

  return events;
}
