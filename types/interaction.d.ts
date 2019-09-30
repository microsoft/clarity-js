/* Event Data */
export interface InputChangeData {
    target: number;
    value: string;
}

export interface PointerData {
    target: number;
    x: number;
    y: number;
    targetX?: number;
    targetY?: number;
    time?: number;
}

export interface ResizeData {
    width: number;
    height: number;
}

export interface ScrollData {
    target: number;
    x: number;
    y: number;
    time?: number;
}

export interface SelectionData {
    start: number;
    startOffset: number;
    end: number;
    endOffset: number;
}

export interface UnloadData {
    name: string;
}

export interface VisibilityData {
    visible: string;
}
