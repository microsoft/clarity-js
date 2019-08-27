import { IPayload, Token } from "@clarity-types/data";
import { Metric } from "@clarity-types/metric";
import config from "@src/core/config";
import {envelope} from "@src/data/metadata";
import { counter } from "@src/metric";
import metrics from "@src/metric/encode";

export default function(events: Token[][]): void {
    let upload = config.upload ? config.upload : send;
    let payload: IPayload = { e: envelope(), m: metrics(), d: events };
    let e = JSON.stringify(payload.e);
    let m = JSON.stringify(payload.m);
    let d = JSON.stringify(payload.d);
    let data = `{"e":${e},"m":${m},"d":${d}}`;
    counter(Metric.Bytes, data.length);
    upload(data);
}

function send(data: string): void {
    if (config.url.length > 0) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", config.url);
        xhr.send(data);
    }
}
