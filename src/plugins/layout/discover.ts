import { layoutStateToArray } from "../../converters/layout";
import StateManager from "./statemanager";
import { getNodeIndex } from "./stateprovider";

export function documentToArray(states: StateManager) {
  return treeToArray(document, states);
}

function treeToArray(root: Node, states: StateManager): any[] {
  let state = states.get(getNodeIndex(root));
  let data = layoutStateToArray(state);
  let childTrees = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    childTrees.push(treeToArray(root.childNodes[i], states));
  }
  // Remove four redundant elements at the front: index, parent, previous, next
  data = data.splice(4);
  data.push(childTrees);
  return data;
}
