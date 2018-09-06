import { IEventArray, IPayload } from "./core";

export const enum WorkerMessageType {
  /* Main thread to Worker messages */
  AddEvent,
  ForceCompression,

  /* Worker to main thread messages */
  CompressedBatch
}

export interface IWorkerMessage {
  type: WorkerMessageType;
}

export interface ITimestampedWorkerMessage extends IWorkerMessage {
  time: number;
}

export interface IAddEventMessage extends ITimestampedWorkerMessage {
  event: IEventArray;
  isXhrErrorEvent?: boolean;
}

export interface ICompressedBatchMessage extends IWorkerMessage {
  compressedData: string;
  rawData: IPayload;
}
