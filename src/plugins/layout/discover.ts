import { createSchema } from "../../../converters/schema";
import { dataToArray } from "../../../converters/toarray";
import StateManager from "./statemanager";
import { getNodeIndex } from "./stateprovider";

export function documentToArray(states: StateManager) {
  return treeToArray(document, states);
}

function treeToArray(root: Node, states: StateManager): any[] {
  let state = states.get(getNodeIndex(root));
  let trimmedState: ILayoutState = JSON.parse(JSON.stringify(state));

  // Remove four redundant elements at the front: index, parent, previous, next
  // Trim the object to avoid sending redundant data
  delete trimmedState.index;
  delete trimmedState.parent;
  delete trimmedState.previous;
  delete trimmedState.next;

  let schema = createSchema(trimmedState);
  let data = dataToArray(trimmedState);

  let childTrees = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    childTrees.push(treeToArray(root.childNodes[i], states));
  }

  let discoverData = [schema, data, childTrees];
  return discoverData;
}
