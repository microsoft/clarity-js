import { Attributes, BoxModelData, DocumentData, HashData, ResourceData, TargetData } from "../layout";
import { PartialEvent } from "./core";

export interface BoxModelEvent extends PartialEvent { data: BoxModelData[]; }
export interface HashEvent extends PartialEvent { data: HashData[]; }
export interface DocumentEvent extends PartialEvent { data: DocumentData; }
export interface DomEvent extends PartialEvent { data: DomData[]; }
export interface ResourceEvent extends PartialEvent { data: ResourceData[]; }
export interface TargetEvent extends PartialEvent { data: TargetData[]; }
export interface LayoutEvent extends PartialEvent {
    data: BoxModelData[] | HashData[] | DocumentData | DomData[] | ResourceData[] | TargetData[];
}

/* Event Data */
export interface DomData {
    id: number;
    parent: number;
    next: number;
    tag: string;
    position: number;
    attributes?: Attributes;
    value?: string;
}
