import { IEvent, IPayload } from "@clarity-types/data";
import * as decode from "@decode/clarity";
import config from "@src/core/config";
import time from "@src/core/time";
import { metadata, sequence } from "@src/data/metadata";
import * as metrics from "@src/metrics";

export default function(events: IEvent[]): void {
    let payload: IPayload = {
        t: time(),
        n: sequence(),
        v: metadata.version,
        p: metadata.pageId,
        u: metadata.userId,
        s: metadata.siteId,
        m: metrics.compute(),
        d: JSON.stringify(events)
    };
    let upload = config.upload ? config.upload : send;
    upload(payload);
}

function send(payload: IPayload): void {
    decode.json(payload);
}
