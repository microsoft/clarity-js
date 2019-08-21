export const enum Mouse {
    Down = "d",
    Up = "u",
    Move = "m",
    Wheel = "w",
    DoubleClick = "b",
    Click = "c"
}

export interface IMouseInteraction {
    type: Mouse;
    time: number;
    x: number;
    y: number;
    target: number;
    buttons: number;
}

export interface IResizeViewport {
    width: number;
    height: number;
}

export interface IScrollViewport {
    time: number;
    x: number;
    y: number;
}

export interface IPageVisibility {
    visible: string;
}
