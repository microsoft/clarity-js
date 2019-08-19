export const enum Mouse {
    Down = "d",
    Up = "u",
    Move = "m",
    Wheel = "w",
    Click = "c"
}

interface IMouseInteraction {
    type: Mouse;
    time: number;
    x: number;
    y: number;
    target: number;
    buttons: number;
}
