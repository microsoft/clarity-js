import { IEnvelope, Token, Upload } from "../types/data";

export default function(tokens: Token[]): IEnvelope {
    return {
        sequence: tokens[0] as number,
        version: tokens[1] as string,
        projectId: tokens[2] as string,
        userId: tokens[3] as string,
        sessionId: tokens[4] as string,
        pageId: tokens[5] as string,
        upload: tokens[6] as Upload,
        end: tokens[7] as number
    };
}
