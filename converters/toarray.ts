import { IEvent, IEventArray } from "../clarity";
import { DiscoverEventName } from "./discoverclient";
import schemas from "./schema";

// We serialize send a lot of JSONs with identical structures and putting all property names on the
// wire every time can be very redundant. We can save bytes by splitting JSON into a separate nested array of
// its property values and a separate nested array of its property names (schema). This way, each unique schema
// has to only be sent for the first event of that type and the following events can then re-use this schema
// on the server for reconstructing the full JSON. More on schema construction:
// https://github.com/Microsoft/clarity-js/blob/master/converters/schema.md
export default function(event: IEvent): IEventArray {
  let discover = event.type === DiscoverEventName;
  let stateArray = event.state;
  let schemaPayload = null;
  if (!discover) {
    let schema = schemas.createSchema(event.state);
    let newSchema = schemas.addSchema(schema);
    stateArray = dataToArray(event.state);
    schemaPayload = newSchema ? schema : schemas.getSchemaId(schema);
  }
  let array = [event.id, event.type, event.time, stateArray, schemaPayload] as IEventArray;
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
      let arrayValue = dataToArray(data[i]);
      dataArray.push(arrayValue);
    }
  }

  return dataArray;
}
