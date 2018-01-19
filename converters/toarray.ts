import StateManager from "./../src/plugins/layout/statemanager";
import { getNodeIndex } from "./../src/plugins/layout/stateprovider";
import { hashCode } from "./../src/utils";
import schemas from "./schema";

export default function(event: IEvent): IEventArray {
  let keys = Object.keys(event);
  let schema = schemas.createSchema(event.data);
  let newSchema = schemas.addSchema(schema);
  let dataArray = dataToArray(event.data);
  let schemaPayload = newSchema ? schema : schemas.getSchemaHashcode(schema);
  let array = [event.id, event.origin, event.type, event.time, dataArray, schemaPayload] as IEventArray;
  return array;
}

export function dataToArray(data: any): any[] {
  if (data === null || typeof data !== "object") {
    return data;
  }

  let dataArray = [];
  if (data.constructor === Object) {
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let val = data[key];
      dataArray.push(dataToArray(val));
    }
  } else if (data.constructor === Array) {
    for (let i = 0; i < data.length; i++) {
      dataArray.push(dataToArray(data[i]));
    }
  }

  return dataArray;
}

export function treeToDiscoverArray(root: Node, states: StateManager): any[] {
  let state = states.get(getNodeIndex(root));
  let trimmedState: ILayoutState = JSON.parse(JSON.stringify(state));

  // Remove four redundant elements at the front: index, parent, previous, next
  // Trim the object to avoid sending redundant data
  delete trimmedState.index;
  delete trimmedState.parent;
  delete trimmedState.previous;
  delete trimmedState.next;

  let schema = schemas.createSchema(trimmedState);
  let newSchema = schemas.addSchema(schema);
  let data = dataToArray(trimmedState);

  let childTrees = [];
  for (let i = 0; i < root.childNodes.length; i++) {
    childTrees.push(treeToDiscoverArray(root.childNodes[i], states));
  }

  let schemaPayload = newSchema ? schema : schemas.getSchemaHashcode(schema);
  let discoverData = [schemaPayload, data, childTrees];
  return discoverData;
}
