import { hashCode } from "./../src/utils";

// schemas[origin][type] = eventSchema
let schemas = {};

export function getSchema(schemaHash: string): ClarityDataSchema {
  return schemas[schemaHash];
}

export function addSchema(schema: ClarityDataSchema): string {
  let schemaHash = hashCode(JSON.stringify(schema));
  schemas[schemaHash] = schema;
  return schemaHash;
}

export function createSchema(data: any, name?: string): ClarityDataSchema {
  let schema: ClarityDataSchema = name || null;
  if (data !== null) {
    if (typeof data === "object") {
      schema = createNestedSchema(data, name);
    } else {
      schema = typeof name === "string" ? name : null;
    }
  }
  return schema;
}

function createNestedSchema(data: object | any[], name?: string): ClarityDataSchema {
  let nestedObjectType = null;
  let dataSchema = null;
  if (data.constructor === Object) {
    nestedObjectType = ObjectType.Object;
    dataSchema = createObjectSchema(data);
  } else if (data.constructor === Array) {
    nestedObjectType = ObjectType.Array;
    dataSchema = createArraySchema(data as any[]);
  }
  let schema = [nestedObjectType, dataSchema];
  if (typeof name === "string") {
    schema.unshift(name);
  }
  return schema;
}

function createObjectSchema(data: object): ClarityDataSchema {
  let schema = [];
  let keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let val = data[key];
    let subschema = createSchema(val, key);
    schema.push(subschema);
  }
  return schema;
}

function createArraySchema(data: any[]): ClarityDataSchema {
  let schema = [];
  for (let i = 0; i < data.length; i++) {
    let subschema = createSchema(data[i]);
    schema.push(subschema);
  }
  return schema;
}
