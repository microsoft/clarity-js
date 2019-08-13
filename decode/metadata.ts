import { Event, IMetadata, Token } from "../types/data";

export default function(tokens: Token[], event: Event): IMetadata {
    return {
        sequence: tokens[0] as number,
        version: tokens[1] as string,
        pageId: tokens[2] as string,
        userId: tokens[3] as string,
        projectId: tokens[4] as string,
        url: tokens[5] as string,
        title: tokens[6] as string
    };
}
