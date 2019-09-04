import { Event, IDecodedEvent, Token } from "../types/data";
import { IMouse, IResize, IScroll, ISelection, Mouse, Scroll } from "../types/interaction";

export default function(tokens: Token[]): IDecodedEvent[] {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    let events: IDecodedEvent[] = [];
    switch (event) {
        case Event.Mouse:
            let m = 2;
            let mouseType = null;
            let mouseTarget = null;
            let mouseTime = 0;
            while (m < tokens.length) {
                if (typeof(tokens[m]) === "string") {
                    mouseType = tokens[m++] as Mouse;
                    mouseTarget = tokens[m++] as number;
                    continue;
                }
                mouseTime += tokens[m++] as number;
                let mouseData: IMouse = {
                    type: mouseType,
                    target: mouseTarget,
                    time: mouseTime,
                    x: tokens[m++] as number,
                    y: tokens[m++] as number,
                    buttons: mouseType === Mouse.Click ? tokens[m++] as number : 0
                };
                events.push({ time: mouseTime, event, data: mouseData});
            }
            break;
        case Event.Resize:
            let resizeData: IResize = {
                width: tokens[2] as number,
                height: tokens[3] as number
            };
            events.push({ time, event, data: resizeData });
            break;
        case Event.Selection:
            let selectionData: ISelection = {
                start: tokens[2] as number,
                startOffset: tokens[3] as number,
                end: tokens[4] as number,
                endOffset: tokens[5] as number
            };
            events.push({ time, event, data: selectionData });
            break;
        case Event.Scroll:
            let s = 2;
            let scrollType = null;
            let target = null;
            let scrollTime = 0;
            while (s < tokens.length) {
                if (typeof(tokens[s]) === "string") {
                    scrollType = tokens[s++] as Scroll;
                    target = tokens[s++] as number;
                    continue;
                }
                scrollTime += tokens[s++] as number;
                let scrollValue = tokens[s++] as number;
                let scrollData: IScroll = { type: scrollType, target, time: scrollTime, value: scrollValue };
                events.push({ time: scrollTime, event, data: scrollData });
            }
            break;
    }
    return events;
}
