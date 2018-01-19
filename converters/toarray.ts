import { IEvent, IEventArray, ILayoutState } from "../declarations/clarity";
import StateManager from "./../src/plugins/layout/statemanager";
import { getNodeIndex } from "./../src/plugins/layout/stateprovider";
import { hashCode } from "./../src/utils";
import schemas from "./schema";

// We serialize send a lot of JSONs with identical structures and putting all property names on the
// wire every time can be very redundant. We can save bytes by splitting JSON into a separate nested array of
// its property values and a separate nested array of its property names (schema). This way, each unique schema
// has to only be sent for the first event of that type and the following events can then re-use this schema
// on the server for reconstructing the full JSON.
export default function(event: IEvent): IEventArray {
  let keys = Object.keys(event);
  let schema = schemas.createSchema(event.data);
  let newSchema = schemas.addSchema(schema);
  let dataArray = dataToArray(event.data);
  let schemaPayload = newSchema ? schema : schemas.getSchemaHashcode(schema);
  let array = [event.id, event.origin, event.type, event.time, dataArray, schemaPayload] as IEventArray;
  return array;
}

// When we discover the entire document or a subtree for the first time, we can structure our payload in a way
// such that some information can be inferred from the structure, as opposed to being written explicitly and this
// allows us to save bytes. Representing layout states as crunched arrays and nesting them within each other in
// a structure identical to the DOM structure would let us avoid explicitly sending index, parent, previous and next props.
// Structure of such payload would be:
//  [data, schema, [Recursive(child 1), Recursive(child 2) ... Recursive(child N)]], where
//  1. data: Trimmed layout state (without index, parent, previous and next) crunched to a value array form
//  2. schema: Data schema, represented as the array of property names
//  3. Array of recursive representations of root's children
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

// Arbitrary JavaScript object can be represented as a value or an array of values without any property names
// Crunching objects to arrays is done the following way:
// 1. Array: Keep object an array, but recursively crunch its contents
// 2. Object with properties: Create an array of recursively crunched property values in the order returned by Object.keys
//    Example: let car = { make: "tesla", model: "3"}. Crunched array would be ["tesla", "3"]
// 3. Other: Just send the value as is
function dataToArray(data: any): any[] {
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
