import { IEvent } from "@clarity-types/data";

export default function(events: IEvent[]): void {
    let json = JSON.stringify(events);
    console.log("Json: " + json);
    window["PAYLOAD"].push(json);
}
