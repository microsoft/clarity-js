export const enum State {
  Loaded,
  Activated,
  Unloaded,
  Activating,
  Unloading
}

export interface IPlugin {
  activate(): void;
  teardown(): void;
  reset(): void;
}

export interface IPayload {
  envelope: IEnvelope;
  events: IEventArray[];
}

export interface IPayloadInfo {
  compressed: string;
  raw: IPayload;
  failureCount: number;
}

export interface IEnvelope {
  clarityId: string;
  impressionId: string;
  projectId: string;
  url: string;
  version: string;
  time?: number;
  sequenceNumber?: number;
}

export interface IEventData {
  type: string;
  state: any;
  time?: number;
}

export interface IEvent extends IEventData {
  id: number; /* Event ID */
  time: number; /* Time relative to page start */
}

export interface IEventBindingPair {
  target: EventTarget;
  listener: EventListener;
}

export interface IBindingContainer {
  [key: string]: IEventBindingPair[];
}

export type UploadCallback = (status: number) => void;
export type UploadHandler = (payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) => void;

// IEvent object converted to a value array representation
export type IEventArray = [
  number, // id
  string, // type
  number, // time
  any[],  // state
  ClarityDataSchema   // data schema, if it's a new one, otherwise - schema hashcode
];

export const enum ObjectType {
  Object,
  Array
}

// For details on schema generation, see schema.md:
// https://github.com/Microsoft/clarity-js/blob/master/converters/schema.md
export type ClarityDataSchema = null | string | any[];
