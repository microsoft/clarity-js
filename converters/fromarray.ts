import {  IEvent, IEventArray, ILayoutState } from "../clarity";
import { Action, ObjectType } from "../clarity";
import { SchemaManager } from "./schema";
import defaultSchemas from "./schema";

export default function(eventArray: IEventArray, schemas?: SchemaManager): IEvent {
  let id, type, time, stateArray, schema;
  [id, type, time, stateArray, schema] = eventArray;

  if (!schemas) {
    schemas = defaultSchemas;
  }

  if (typeof schema === "number") {
    schema = schemas.getSchema(schema);
  } else {
    schemas.addSchema(schema);
  }

  let state = dataFromArray(stateArray, schema as any[]);
  let event: IEvent = { id, type, time, state };
  return event;
}

// This function reconstructs the original object from array of data and a schema that describes it. Check schema.md for details:
// https://github.com/Microsoft/clarity-js/blob/master/converters/schema.md
function dataFromArray(dataArray: any[], schema: any[]): any {
  // Schema is of type "string" or null when data that matches it is not an Array or an Object,
  // so no additional reconstruction on the data is required.
  if (typeof schema === "string" || schema === null) {
    return dataArray;
  }

  let data = null;
  let dataType = null;
  let subschemas = null;
  if (schema.length === 2) {
    // Schema is [ObjectType, [Array values' or Object properties' schemas (based on the object type) ]]
    dataType = schema[0];
    subschemas = schema[1];
  } else if (schema.length === 3) {
    // Schema is [Property name in parent object, ObjectType, [Array values' or Object properties' schemas (based on the object type) ]]
    dataType = schema[1];
    subschemas = schema[2];
  }

  if (dataType === ObjectType.Object) {
    data = {};
    for (let i = 0; i < subschemas.length; i++) {
      let currentSubschema = subschemas[i];
      let currentProperty = null;
      if (typeof currentSubschema === "string") {
        currentProperty = currentSubschema;
      } else {
        currentProperty = currentSubschema[0];
      }
      data[currentProperty] = dataFromArray(dataArray[i], currentSubschema);
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
