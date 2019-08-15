export const enum Mouse {
    Down = "d",
    Up = "u",
    Move = "m",
    Wheel = "w",
    Click = "c"
}

interface IMouseInteraction {
    time: number;
    type: Mouse;
    x: number;
    y: number;
    target: number;
    buttons: number;
}
