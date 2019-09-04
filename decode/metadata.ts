import { Event, IDecodedEvent, Token } from "../types/data";

export default function(tokens: Token[]): IDecodedEvent[] {
    return [{
        time: tokens[0] as number,
        event: tokens[1] as Event,
        data: {
            sequence: tokens[2] as number,
            version: tokens[3] as string,
            pageId: tokens[4] as string,
            userId: tokens[5] as string,
            projectId: tokens[6] as string,
            url: tokens[7] as string,
            title: tokens[8] as string,
            referrer: tokens[9] as string
        }
    }];
}
