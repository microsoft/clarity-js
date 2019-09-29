import { Event, Token } from "../types/data";
import { IDiagnosticEvent } from "../types/decode";
import { IBrokenImageData, IScriptErrorData } from "../types/diagnostic";

export function decode(tokens: Token[]): IDiagnosticEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    switch (event) {
        case Event.ImageError:
            let imageError: IBrokenImageData = {
                source: tokens[2] as string,
                target: tokens[3] as number
            };
            return { time, event, data: imageError };
        case Event.Selection:
            let scriptError: IScriptErrorData = {
                source: tokens[2] as string,
                message: tokens[3] as string,
                line: tokens[4] as number,
                column: tokens[5] as number,
                stack: tokens[6] as string
            };
            return { time, event, data: scriptError };
    }
}
