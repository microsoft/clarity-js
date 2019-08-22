import { Event, IDecodedEvent, Token } from "../types/data";
import { IResize, IScroll, Scroll } from "../types/interaction";

export default function(tokens: Token[]): IDecodedEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    let decoded: IDecodedEvent = {time, event, data: []};
    switch (event) {
        case Event.Resize:
            let r: IResize = { width: tokens[2] as number, height: tokens[3] as number };
            decoded.data.push(r);
        case Event.Scroll:
                let i = 2;
                let scrollType = null;
                let target = null;
                let t = 0;
                while (i < tokens.length) {
                    if (typeof(tokens[i]) === "string") {
                        scrollType = tokens[i++] as Scroll;
                        target = tokens[i++] as number;
                        continue;
                    }
                    t += tokens[i++] as number;
                    let v = tokens[i++] as number;
                    let s: IScroll = { type: scrollType, target, time: t, value: v };
                    decoded.data.push(s);
                }
                break;
    }
    return decoded;
}
