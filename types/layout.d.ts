/* Enum */

export const enum Source {
    Discover,
    ChildListAdd,
    ChildListRemove,
    Attributes,
    CharacterData
}

/* Helper Interfaces */

export interface Attributes {
    [key: string]: string;
}

export interface NodeInfo {
    tag: string;
    path?: string;
    attributes?: Attributes;
    value?: string;
}

export interface NodeValue {
    id: number;
    parent: number;
    next: number;
    children: number[];
    data: NodeInfo;
    selector: string;
    metadata: NodeMeta;
}

export interface NodeMeta {
    active: boolean;
    boxmodel: boolean;
    masked: boolean;
}

export interface NodeChange {
    time: number;
    source: Source;
    value: NodeValue;
}

/* Event Data */

export interface DocumentData {
    width: number;
    height: number;
}

export interface BoxModelData {
    id: number;
    box: number[];
}

export interface HashData {
    id: number;
    hash: string;
    selector?: string;
}

export interface ResourceData {
    tag: string;
    url: string;
}
