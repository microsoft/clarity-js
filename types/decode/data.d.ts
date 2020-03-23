import { MetricData, PageData, PingData, SummaryData, TagData, TargetData, UpgradeData, UploadData } from "../data";
import { PartialEvent } from "./core";

/* Data Events */
export interface MetricEvent extends PartialEvent { data: MetricData; }
export interface PageEvent extends PartialEvent { data: PageData; }
export interface PingEvent extends PartialEvent { data: PingData; }
export interface SummaryEvent extends PartialEvent { data: SummaryData[]; }
export interface TagEvent extends PartialEvent { data: TagData; }
export interface TargetEvent extends PartialEvent { data: TargetData[]; }
export interface UpgradeEvent extends PartialEvent { data: UpgradeData; }
export interface UploadEvent extends PartialEvent { data: UploadData; }
export interface DataEvent extends PartialEvent {
    data: MetricData | PageData | PingData | SummaryData[] | TagData | TargetData[] | UpgradeData | UploadData;
}