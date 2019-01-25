import { ClarityDataSchema, ObjectType } from "../../types/core";

// Details about schema generation are in schema.md:
// https://github.com/Microsoft/clarity-js/blob/master/converters/schema.md

export class SchemaManager {

  private schemas: ClarityDataSchema[];
  private schemaToIdMap;

  constructor() {
    this.reset();
  }

  public reset() {
    this.schemas = [];
    this.schemaToIdMap = {};
  }

  public addSchema(schema: ClarityDataSchema): boolean {
    let schemaStr = JSON.stringify(schema);
    let isNew = !(schemaStr in this.schemaToIdMap);
    if (isNew) {
      this.schemaToIdMap[schemaStr] = this.schemas.length;
      this.schemas.push(schema);
    }
    return isNew;
  }

  public createSchema(data: any, name?: string): ClarityDataSchema {
    let schema: ClarityDataSchema = name || null;
    if (data !== null) {
      if (typeof data === "object" && (data.constructor === Object || data.constructor === Array)) {
        // Objects with properties and Arrays require nested schema generation
        schema = this.createNestedSchema(data, name);
      } else {
        // Primitives and simple objects can return schema immediately
        schema = typeof name === "string" ? name : null;
      }
    }
    return schema;
  }

  public getSchema(schemaId: number): ClarityDataSchema {
    return this.schemas[schemaId];
  }

  public getSchemaId(schema: ClarityDataSchema): number | undefined {
    return this.schemaToIdMap[JSON.stringify(schema)];
  }

  private createNestedSchema(data: object | any[], name?: string): ClarityDataSchema {
    let nestedObjectType = null;
    let dataSchema = null;
    if (data.constructor === Object) {
      nestedObjectType = ObjectType.Object;
      dataSchema = this.createObjectSchema(data);
    } else if (data.constructor === Array) {
      nestedObjectType = ObjectType.Array;
      dataSchema = this.createArraySchema(data as any[]);
    }
    let schema = [nestedObjectType, dataSchema];
    if (typeof name === "string") {
      schema.unshift(name);
    }
    return schema;
  }

  private createObjectSchema(data: object): ClarityDataSchema {
    let schema = [];
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let val = data[key];
      let subschema = this.createSchema(val, key);
      schema.push(subschema);
    }
    return schema;
  }

  private createArraySchema(data: any[]): ClarityDataSchema {
    let schema = [];
    for (let i = 0; i < data.length; i++) {
      let subschema = this.createSchema(data[i]);
      schema.push(subschema);
    }
    return schema;
  }
}

export function resetSchemas() {
  schemaManager.reset();
}

let schemaManager: SchemaManager = new SchemaManager();
export default schemaManager;
