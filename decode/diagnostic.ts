import { Event, Token } from "../types/data";
import { DiagnosticEvent } from "../types/decode/diagnostic";
import { ImageErrorData, ScriptErrorData } from "../types/diagnostic";

export function decode(tokens: Token[]): DiagnosticEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    switch (event) {
        case Event.ImageError:
            let imageError: ImageErrorData = {
                source: tokens[2] as string,
                target: tokens[3] as number
            };
            return { time, event, data: imageError };
        case Event.ScriptError:
            let scriptError: ScriptErrorData = {
                message: tokens[2] as string,
                line: tokens[3] as number,
                column: tokens[4] as number,
                stack: tokens[5] as string,
                source: tokens[6] as string
            };
            return { time, event, data: scriptError };
    }
}
