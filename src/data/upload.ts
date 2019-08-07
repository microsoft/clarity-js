import { IEvent, IPayload } from "@clarity-types/data";
import * as decode from "@decode/clarity";
import config from "@src/core/config";
import * as track from "@src/data/track";

export default function(events: IEvent[]): void {
    let payload: IPayload = {
        p: track.pageId,
        s: track.sessionId,
        t: track.tenantId,
        n: track.sequence(),
        d: JSON.stringify(events)
    };
    let upload = config.upload ? config.upload : send;
    upload(payload);
}

function send(payload: IPayload): void {
    decode.json(payload);
}
