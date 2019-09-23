import { Event, IDecodedEvent, IPageData, IPingData, ITagData, Token } from "../types/data";

export default function(tokens: Token[]): IDecodedEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    switch (event) {
        case Event.Page:
            let page: IPageData = {
                timestamp: tokens[2] as number,
                elapsed: tokens[3] as number,
                url: tokens[4] as string,
                title: tokens[5] as string,
                referrer: tokens[6] as string
            };
            return { time, event, data: page };
        case Event.Ping:
            let ping: IPingData = { gap: tokens[2] as number };
            return { time, event, data: ping };
        case Event.Tag:
            let tag: ITagData = { key: tokens[2] as string, value: tokens[3] as string };
            return { time, event, data: tag };
    }
}
