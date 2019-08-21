import { Event, IDecodedEvent, Token } from "../types/data";
import { IResizeViewport, IScrollViewport } from "../types/interaction";

export default function(tokens: Token[]): IDecodedEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    let decoded: IDecodedEvent = {time, event, data: []};
    switch (event) {
        case Event.Resize:
            let r: IResizeViewport = { width: tokens[2] as number, height: tokens[3] as number };
            decoded.data.push(r);
        case Event.Scroll:
            let t = time;
            for (let i = 2; i < tokens.length; i = i + 3) {
                t += tokens[i] as number;
                let s: IScrollViewport = { time: t, x: tokens[i + 1] as number, y: tokens[i + 2] as number };
                decoded.data.push(s);
            }
            break;
    }
    return decoded;
}
