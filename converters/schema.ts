import { ClarityDataSchema, ObjectType } from "../declarations/clarity";
import { hashCode } from "./../src/utils";

export class SchemaManager {

  private schemas = {};

  public getSchema(schemaHash: string): ClarityDataSchema {
    return this.schemas[schemaHash];
  }

  public addSchema(schema: ClarityDataSchema): boolean {
    let schemaHash = hashCode(JSON.stringify(schema));
    let isNew = (typeof this.getSchema(schemaHash) === "undefined");
    this.schemas[schemaHash] = schema;
    return isNew;
  }

  public createSchema(data: any, name?: string): ClarityDataSchema {
    let schema: ClarityDataSchema = name || null;
    if (data !== null) {
      if (typeof data === "object") {
        schema = this.createNestedSchema(data, name);
      } else {
        schema = typeof name === "string" ? name : null;
      }
    }
    return schema;
  }

  public getSchemaHashcode(schema: ClarityDataSchema) {
    return hashCode(JSON.stringify(schema));
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

let schemaManager = new SchemaManager();
export default schemaManager;
