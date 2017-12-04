import { layoutStateFromArray } from "./layout";

export default function(discover: any[]): IDiscover {
  let data: IDiscover = {
    dom:    discover[0]
  };
  return data;
}

function discoverToLayoutStates(data: any[], index: number, parent: ILayoutState, previous: ILayoutState): ILayoutState[] {
  // Next element hasn't been parsed yet at this point, so we don't know its index
  let nextIndex = null;
  let previousIndex = previous ? previous.index : null;
  let parentIndex = parent ? parent.index : null;
  let children = data[data.length - 1];
  let pureData = data.slice(0, data.length - 1);
  let fullData = [index, parentIndex, previousIndex, nextIndex].concat(pureData);

  if (previous) {
    previous.next = index;
  }
  index++;

  // Generate layouts in the same order as they were indexed on the client - DFS order
  let thisLayout = layoutStateFromArray(fullData);
  let layouts = [ thisLayout ];
  let previousChild = null;
  for (let i = 0; i < children.length; i++) {
    let nextChildLayouts = discoverToLayoutStates(children[i], index, thisLayout, previousChild);
    previousChild = nextChildLayouts[0];
    index += nextChildLayouts.length;
    layouts = layouts.concat(nextChildLayouts);
  }

  return layouts;
}
