import { IConfig } from "./config";
import { ClarityDataSchema, IEvent, IEventArray } from "./core";

declare class SchemaManager {
  constructor();
  public reset(): void;
  public addSchema(schema: ClarityDataSchema): boolean;
  public createSchema(data: any, name?: string): ClarityDataSchema;
  public getSchema(schemaId: number): ClarityDataSchema;
  public getSchemaId(schema: ClarityDataSchema): number | undefined;
}

interface IClarityJs {
  version: string;
  start(config?: IConfig): void;
  stop(): void;
  trigger(key: string): void;
}

interface IPayloadEncoder {
  SchemaManager: typeof SchemaManager;
  encode(event: IEvent): IEventArray;
  decode(eventArray: IEventArray, schemas?: SchemaManager): IEvent;
}

declare const ClarityJs: IClarityJs;
declare const PayloadEncoder: IPayloadEncoder;

export * from "./compressionworker";
export * from "./config";
export * from "./core";
export * from "./instrumentation";
export * from "./layout";
export * from "./performance";
export * from "./pointer";
export * from "./viewport";

export { ClarityJs, PayloadEncoder };
