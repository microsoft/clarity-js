/* Event Data */
export interface IChangeData {
    target: number;
    value: string;
}

export interface IPointerData {
    target: number;
    x: number;
    y: number;
    targetX?: number;
    targetY?: number;
    time?: number;
}

export interface IResizeData {
    width: number;
    height: number;
}

export interface IScrollData {
    target: number;
    x: number;
    y: number;
    time?: number;
}

export interface ISelectionData {
    start: number;
    startOffset: number;
    end: number;
    endOffset: number;
}

export interface IUnloadData {
    name: string;
}

export interface IVisibileData {
    visible: string;
}
