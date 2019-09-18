import { Event, IDecodedEvent, Token } from "../types/data";

export default function(tokens: Token[]): IDecodedEvent {
    return {
        time: tokens[0] as number,
        event: tokens[1] as Event,
        data: {
            timestamp: tokens[2] as number,
            elapsed: tokens[3] as number,
            url: tokens[4] as string,
            title: tokens[5] as string,
            referrer: tokens[6] as string
        }
    };
}
