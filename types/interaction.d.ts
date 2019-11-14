import { Target } from "./data";

/* Helper Interfaces */
export interface PointerState {
    time: number;
    event: number;
    data: PointerData;
}

export interface ScrollState {
    time: number;
    event: number;
    data: ScrollData;
}

/* Event Data */
export interface InputChangeData {
    target: Target;
    value: string;
}

export interface PointerData {
    target: Target;
    x: number;
    y: number;
}

export interface ResizeData {
    width: number;
    height: number;
}

export interface ScrollData {
    target: Target;
    x: number;
    y: number;
}

export interface SelectionData {
    start: Target;
    startOffset: number;
    end: Target;
    endOffset: number;
}

export interface UnloadData {
    name: string;
}

export interface VisibilityData {
    visible: string;
}
