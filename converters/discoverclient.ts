import { ILayoutState } from "../clarity";
import { ShadowDom } from "../src/plugins/layout/shadowdom";
import { getNodeIndex } from "../src/plugins/layout/stateprovider";
import schemas from "./schema";
import { dataToArray } from "./toarray";

export const DiscoverEventName = "Discover";

export function treeToDiscoverArray(root: Node, shadowDom: ShadowDom): any[] {
  let state = shadowDom.getNodeInfo(getNodeIndex(root)).state;
  let trimmedState: ILayoutState = JSON.parse(JSON.stringify(state));

  // Remove four redundant elements at the front: index, parent, previous, next
  // Trim the object to avoid sending redundant data
  delete trimmedState.index;
  delete trimmedState.parent;
  delete trimmedState.previous;
  delete trimmedState.next;
  delete trimmedState.action;
  delete trimmedState.source;

  let schema = schemas.createSchema(trimmedState);
  let newSchema = schemas.addSchema(schema);
  let data = dataToArray(trimmedState);

  let childTrees = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    childTrees.push(treeToDiscoverArray(root.childNodes[i], shadowDom));
  }

  let schemaPayload = newSchema ? schema : schemas.getSchemaId(schema);
  let discoverData = [schemaPayload, data, childTrees];
  return discoverData;
}
