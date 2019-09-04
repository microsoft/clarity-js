import { Event, IDecodedEvent, Token } from "../types/data";
import { IMouse, IResize, IScroll, ISelection } from "../types/interaction";

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
            let mouseData: IMouse = { target: tokens[2] as number, x: tokens[3] as number, y: tokens[4] as number };
            return { time, event, data: mouseData };
        case Event.Resize:
            let resizeData: IResize = { width: tokens[2] as number, height: tokens[3] as number };
            return { time, event, data: resizeData };
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
