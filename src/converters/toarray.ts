import { IEvent, IEventArray } from "../../types/core";
import schemas from "./schema";

// We serialize send a lot of JSONs with identical structures and putting all property names on the
// wire every time can be very redundant. We can save bytes by splitting JSON into a separate nested array of
// its property values and a separate nested array of its property names (schema). This way, each unique schema
// has to only be sent for the first event of that type and the following events can then re-use this schema
// on the server for reconstructing the full JSON.
export default function(event: IEvent): IEventArray {
  let schema = schemas.createSchema(event.state);
  let newSchema = schemas.addSchema(schema);
  let stateArray = dataToArray(event.state);
  let schemaPayload = newSchema ? schema : schemas.getSchemaId(schema);
  let array = [event.id, event.type, event.time, stateArray, schemaPayload] as IEventArray;
  return array;
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
      let arrayValue = dataToArray(data[i]);
      dataArray.push(arrayValue);
    }
  }

  return dataArray;
}
