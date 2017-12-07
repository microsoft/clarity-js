import { layoutStateFromArray } from "./layout";

let discoverConverters = [];
discoverConverters[DiscoverEventType.Discover] = discoverFromArray;

export default discoverConverters;

export function discoverToEvents(id: number, time: number, data: IDiscover): IEvent[] {
  let events = discoverToEventsRecursive(id, time, data.dom, 0, null, null);
  return events;
}

function discoverFromArray(discover: any[]): IDiscover {
  let data: IDiscover = {
    dom: discover[0]
  };
  return data;
}

function discoverToEventsRecursive(
    id: number, time: number, data: any[], index: number, parent: ILayoutState, previous: ILayoutState
  ): IEvent[] {
  // Next element hasn't been parsed yet at this point, so we don't know its index
  let nextIndex = null;
  let previousIndex = previous ? previous.index : null;
  let parentIndex = parent ? parent.index : null;
  let children = data[data.length - 1];
  let pureData = data.slice(0, data.length - 1);
  let layoutStateArray = [index, parentIndex, previousIndex, nextIndex].concat(pureData);
  let layoutState = layoutStateFromArray(layoutStateArray);

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
    let nextChildEvents = discoverToEventsRecursive(id, time, children[i], index, thisEvent.data.state, previousChildState);
    previousChildState = nextChildEvents[0].data.state;
    index += nextChildEvents.length;
    events = events.concat(nextChildEvents);
  }

  return events;
}
