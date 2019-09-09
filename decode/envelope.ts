import { IEnvelope, Token, Upload } from "../types/data";

export default function(tokens: Token[]): IEnvelope {
    return {
        sequence: tokens[0] as number,
        version: tokens[1] as string,
        pageId: tokens[2] as string,
        userId: tokens[3] as string,
        projectId: tokens[4] as string,
        upload: tokens[5] as Upload,
        end: tokens[6] as number
    };
}
