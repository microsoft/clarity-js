import { Event, Token } from "../types/data";
import { InteractionEvent } from "../types/decode/interaction";
import { InputChangeData, PointerData, ResizeData, ScrollData, SelectionData, UnloadData, VisibilityData } from "../types/interaction";

export function decode(tokens: Token[]): InteractionEvent  {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    switch (event) {
        case Event.MouseDown:
        case Event.MouseUp:
        case Event.MouseMove:
        case Event.MouseWheel:
        case Event.Click:
        case Event.DoubleClick:
        case Event.RightClick:
        case Event.TouchStart:
        case Event.TouchCancel:
        case Event.TouchEnd:
        case Event.TouchMove:
            let pointerData: PointerData = { target: tokens[2] as number, x: tokens[3] as number, y: tokens[4] as number };
            return { time, event, data: pointerData };
        case Event.Resize:
            let resizeData: ResizeData = { width: tokens[2] as number, height: tokens[3] as number };
            return { time, event, data: resizeData };
        case Event.InputChange:
            let changeData: InputChangeData = {
                target: tokens[2] as number,
                value: tokens[3] as string
            };
            return { time, event, data: changeData };
        case Event.Selection:
            let selectionData: SelectionData = {
                start: tokens[2] as number,
                startOffset: tokens[3] as number,
                end: tokens[4] as number,
                endOffset: tokens[5] as number
            };
            return { time, event, data: selectionData };
        case Event.Scroll:
            let scrollData: ScrollData = { target: tokens[2] as number, x: tokens[3] as number, y: tokens[4] as number };
            return { time, event, data: scrollData };
        case Event.Visibility:
            let visibleData: VisibilityData = { visible: tokens[2] as string };
            return { time, event, data: visibleData };
        case Event.Unload:
            let unloadData: UnloadData = { name: tokens[2] as string };
            return { time, event, data: unloadData };
    }
}
