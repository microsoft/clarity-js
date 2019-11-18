import { ConnectionData, LargestContentfulData, LongTaskData, MemoryData, NavigationData, NetworkData, PaintData } from "../performance";
import { PartialEvent } from "./core";

export interface ConnectionEvent extends PartialEvent { data: ConnectionData; }
export interface LargestContentfulEvent extends PartialEvent { data: LargestContentfulData; }
export interface LongTaskEvent extends PartialEvent { data: LongTaskData; }
export interface MemoryEvent extends PartialEvent { data: MemoryData; }
export interface NavigationEvent extends PartialEvent { data: NavigationData; }
export interface NetworkEvent extends PartialEvent { data: NetworkData; }
export interface PaintEvent extends PartialEvent { data: PaintData; }
export interface PerformanceEvent extends PartialEvent {
    data: ConnectionData | LargestContentfulData | LongTaskData | MemoryData | NavigationData | NetworkData[] | PaintData;
}
