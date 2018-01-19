import { getSchema } from "./schema";

export default function(eventArray: IEventArray): IEvent {
  let id        = eventArray[0];
  let origin    = eventArray[1];
  let type      = eventArray[2];
  let time      = eventArray[3];
  let dataArray = eventArray[4];
  let schema    = eventArray[5];

  if (typeof schema === "string") {
    schema = getSchema(schema);
  }

  let data = dataFromArray(dataArray, schema as any[]);
  let event: IEvent = { origin, type, id, time, data };
  return event;
}

export function dataFromArray(dataArray: any[], schema: any[]): any {
  if (typeof schema === "string" || schema === null) {
    return dataArray;
  }

  let data = null;
  let dataType = null;
  let subschemas = null;
  if (schema.length === 2) {
    dataType = schema[0];
    subschemas = schema[1];
  } else if (schema.length === 3) {
    dataType = schema[1];
    subschemas = schema[2];
  } else {
    console.log("Unexpected schema length");
  }

  if (dataType === ObjectType.Object) {
    data = {};
    for (let i = 0; i < subschemas.length; i++) {
      let nextSubschema = subschemas[i];
      let nextProperty = null;
      if (typeof nextSubschema === "string") {
        nextProperty = nextSubschema;
      } else {
        nextProperty = nextSubschema[0];
      }

      data[nextProperty] = dataFromArray(dataArray[i], nextSubschema);
    }
  } else if (dataType === ObjectType.Array) {
    data = [];
    for (let i = 0; i < subschemas.length; i++) {
      let nextSubschema = subschemas[i];
      data.push(dataFromArray(dataArray[i], nextSubschema));
    }
  }
  return data;
}
