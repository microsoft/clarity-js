export interface IAttributes {
    [key: string]: string;
}

export interface INodeData {
    tag: string;
    attributes?: IAttributes;
    layout?: number[];
    value?: string;
}

export interface INodeValue {
    id: number;
    parent: number;
    next: number;
    children: number[];
    data: INodeData;
    active?: boolean;
    update?: boolean;
}

export interface IDecodedNode {
    id: number;
    parent: number;
    next: number;
    tag: string;
    attributes?: IAttributes;
    layout?: number[][];
    value?: string;
}
