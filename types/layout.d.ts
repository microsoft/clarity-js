/* Enum */

export const enum Source {
    Discover,
    ChildListAdd,
    ChildListRemove,
    Attributes,
    CharacterData
}

/* Helper Interfaces */

export interface IAttributes {
    [key: string]: string;
}

export interface INodeInfo {
    tag: string;
    path?: string;
    attributes?: IAttributes;
    value?: string;
}

export interface INodeValue {
    id: number;
    parent: number;
    next: number;
    children: number[];
    data: INodeInfo;
    selector: string;
    metadata: INodeMeta;
}

export interface INodeMeta {
    active: boolean;
    boxmodel: boolean;
    masked: boolean;
}

export interface INodeChange {
    time: number;
    source: Source;
    value: INodeValue;
}

/* Event Data */

export interface IDocumentData {
    width: number;
    height: number;
}

export interface IBoxModelData {
    id: number;
    box: number[];
}

export interface IChecksumData {
    id: number;
    checksum: string;
    selector?: string;
}

export interface IResourceData {
    tag: string;
    url: string;
}
