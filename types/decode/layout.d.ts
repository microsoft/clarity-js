import { Attributes, BoxModelData, DocumentData, HashData, ResourceData } from "../layout";
import { PartialEvent } from "./core";

export interface BoxModelEvent extends PartialEvent { data: BoxModelData[]; }
export interface HashEvent extends PartialEvent { data: HashData[]; }
export interface DocumentEvent extends PartialEvent { data: DocumentData; }
export interface DomEvent extends PartialEvent { data: DomData[]; }
export interface ResourceEvent extends PartialEvent { data: ResourceData[]; }
export interface LayoutEvent extends PartialEvent {
    data: BoxModelData[] | HashData[] | DocumentData | DomData[] | ResourceData[];
}

/* Event Data */
export interface DomData {
    id: number;
    parent: number;
    next: number;
    tag: string;
    attributes?: Attributes;
    value?: string;
}
