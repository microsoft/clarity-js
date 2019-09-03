export const enum Mouse {
    Down = "D",
    Up = "U",
    Move = "M",
    Wheel = "W",
    DoubleClick = "B",
    Click = "C"
}

export interface IMouse {
    type: Mouse;
    target: number;
    time: number;
    x: number;
    y: number;
    buttons: number;
}

export interface IResize {
    width: number;
    height: number;
}

export const enum Scroll {
    X = "X",
    Y = "Y"
}

export interface IScroll {
    type: Scroll;
    target: number;
    time: number;
    value: number;
}

export interface IPageVisibility {
    visible: string;
}

export interface ISelection {
    start: number;
    startOffset: number;
    end: number;
    endOffset: number;
}
