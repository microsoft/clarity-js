/* Enum */

export const enum Source {
    Discover,
    ChildListAdd,
    ChildListRemove,
    Attributes,
    CharacterData
}

export const enum Constant {
    SVG_PREFIX = "svg:",
    SVG_NAMESPACE = "http://www.w3.org/2000/svg",
    DEVTOOLS_HOOK = "__CLARITY_DEVTOOLS_HOOK__",
    ID_ATTRIBUTE = "data-clarity",
    MASK_ATTRIBUTE = "data-clarity-mask",
    UNMASK_ATTRIBUTE = "data-clarity-unmask"
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
    position: number;
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
    selector: string;
}

export interface ResourceData {
    tag: string;
    url: string;
}
