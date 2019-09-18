import { IEnvelope, Token, Upload } from "../types/data";

export default function(tokens: Token[]): IEnvelope {
    return {
        elapsed: tokens[0] as number,
        sequence: tokens[1] as number,
        version: tokens[2] as string,
        projectId: tokens[3] as string,
        userId: tokens[4] as string,
        sessionId: tokens[5] as string,
        pageId: tokens[6] as string,
        upload: tokens[7] as Upload,
        end: tokens[8] as number
    };
}
