import { IEvent } from "@clarity-types/data";
import * as decode from "@decode/clarity";
import config from "@src/core/config";

export default function(events: IEvent[]): void {
    let payload = JSON.stringify(events);
    let upload = config.upload ? config.upload : send;
    upload(payload);
}

function send(payload: string): void {
    console.log("JSON Length: " + JSON.stringify(payload).length);
    console.log("JSON: " + JSON.stringify(payload));
    decode.json(payload);
}
