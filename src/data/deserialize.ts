import domDeserialize from "../dom/deserialize";

export default function(payload: string): string {
    let json = JSON.parse(payload);
    return domDeserialize(json.dom);
}
