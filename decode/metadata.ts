import { Event, IMetadata, Token } from "../types/data";

export default function(tokens: Token[], event: Event): IMetadata {
    return {
        version: tokens[0] as string,
        pageId: tokens[1] as string,
        userId: tokens[2] as string,
        siteId: tokens[3] as string,
        url: tokens[4] as string,
        title: tokens[5] as string
    };
}
