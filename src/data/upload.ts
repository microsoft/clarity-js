import { IEventQueue, IPayload } from "@clarity-types/data";
import { Metric } from "@clarity-types/metric";
import * as decode from "@decode/clarity";
import config from "@src/core/config";
import {envelope} from "@src/data/metadata";
import { counter } from "@src/metric";
import metrics from "@src/metric/encode";

export default function(events: IEventQueue): void {
    let upload = config.upload ? config.upload : send;
    let payload: IPayload = { e: envelope(), m: metrics(), a: events.one, b: events.two };
    let e = JSON.stringify(payload.e);
    let m = JSON.stringify(payload.m);
    let a = JSON.stringify(payload.a);
    let b = JSON.stringify(payload.b);
    let data = `{"e":${e},"m":${m},"a":${a},"b":${b}}`;
    counter(Metric.Bytes, data.length);
    counter(Metric.StreamOneBytes, a.length);
    counter(Metric.StreamTwoBytes, b.length);
    upload(data);
}

function send(data: string): void {
    decode.json(data);
}
