import { IEvent } from "@clarity-types/data";
import * as decode from "@decode/clarity";
import config from "@src/core/config";

export default function(events: IEvent[]): void {
    let payload = JSON.stringify(events);
    let upload = config.upload ? config.upload : send;
    upload(payload);
}

function send(payload: string): void {
    decode.json(payload);
}
