import { IEvent, IPayload } from "@clarity-types/data";
import * as decode from "@decode/clarity";
import config from "@src/core/config";
import {envelope} from "@src/data/metadata";
import metrics from "@src/metrics/encode";

export default function(events: IEvent[]): void {
    let payload: IPayload = {
        e: envelope(),
        m: metrics(),
        d: events
    };
    let upload = config.upload ? config.upload : send;
    upload(JSON.stringify(payload));
}

function send(data: string): void {
    decode.json(data);
}
