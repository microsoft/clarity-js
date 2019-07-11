import domDeserialize from "./deserialization/dom";

export default function(payload: string): string {
    let json = JSON.parse(payload);
    return domDeserialize(json.dom);
}
