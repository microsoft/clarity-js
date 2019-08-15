import { IEvent, IPayload } from "@clarity-types/data";
import { Metric } from "@clarity-types/metric";
import * as decode from "@decode/clarity";
import config from "@src/core/config";
import {envelope} from "@src/data/metadata";
import { measure } from "@src/metric";
import metrics from "@src/metric/encode";

export default function(events: IEvent[]): void {
    let payload: IPayload = {
        e: envelope(),
        m: metrics(),
        d: events
    };
    let upload = config.upload ? config.upload : send;
    let data = JSON.stringify(payload);
    measure(Metric.ByteCount, data.length);
    upload(data);
}

function send(data: string): void {
    decode.json(data);
}
