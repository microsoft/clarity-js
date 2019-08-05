import { IEvent } from "@clarity-types/data";
import * as decode from "@decode/clarity";

export default function(events: IEvent[]): void {
    let json = JSON.stringify(events);
    console.log("JSON Length: " + JSON.stringify(json).length);
    console.log("JSON: " + JSON.stringify(json));
    decode.json(json);
}
