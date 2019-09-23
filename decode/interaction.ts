import { Event, IDecodedEvent, Token } from "../types/data";
import { IChange, IPointer, IResize, IScroll, ISelection } from "../types/interaction";

export default function(tokens: Token[]): IDecodedEvent {
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
            let pointerData: IPointer = { target: tokens[2] as number, x: tokens[3] as number, y: tokens[4] as number };
            if (tokens.length > 6) {
                pointerData.targetX = tokens[5] as number;
                pointerData.targetY = tokens[6] as number;
            }
            return { time, event, data: pointerData };
        case Event.Resize:
            let resizeData: IResize = { width: tokens[2] as number, height: tokens[3] as number };
            return { time, event, data: resizeData };
        case Event.Change:
            let changeData: IChange = {
                target: tokens[2] as number,
                value: tokens[3] as string
            };
            return { time, event, data: changeData };
        case Event.Selection:
            let selectionData: ISelection = {
                start: tokens[2] as number,
                startOffset: tokens[3] as number,
                end: tokens[4] as number,
                endOffset: tokens[5] as number
            };
            return { time, event, data: selectionData };
        case Event.Scroll:
            let scrollData: IScroll = { target: tokens[2] as number, x: tokens[3] as number, y: tokens[4] as number };
            return { time, event, data: scrollData };
        default:
            return { time, event, data: tokens.slice(2) };
    }
}
