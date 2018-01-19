import { hashCode } from "./../src/utils";
import fromArray from "./fromarray";
import schemas from "./schema";

export default function(event: IEvent): IEventArray {
  let keys = Object.keys(event);
  let schema = schemas.createSchema(event.data);
  let newSchema = schemas.addSchema(schema);
  let dataArray = dataToArray(event.data);
  let schemaPayload = newSchema ? schema : schemas.getSchemaHashcode(schema);
  let array = [event.id, event.origin, event.type, event.time, dataArray, schemaPayload] as IEventArray;

  let original = fromArray(array);
  if (JSON.stringify(event).length !== JSON.stringify(original).length) {
    original = fromArray(array);
  }

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
