import { Event, IDecodedEvent, Token } from "../types/data";
import { IImageError, IScriptError } from "../types/diagnostic";

export default function(tokens: Token[]): IDecodedEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    switch (event) {
        case Event.ImageError:
            let imageError: IImageError = {
                source: tokens[2] as string,
                target: tokens[3] as number
            };
            return { time, event, data: imageError };
        case Event.Selection:
            let scriptError: IScriptError = {
                source: tokens[2] as string,
                message: tokens[3] as string,
                line: tokens[4] as number,
                column: tokens[5] as number,
                stack: tokens[6] as string
            };
            return { time, event, data: scriptError };
    }
}
