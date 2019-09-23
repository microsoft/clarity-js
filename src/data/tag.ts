import { Event, ITagData } from "@clarity-types/data";
import encode from "@src/data/encode";

export let data: ITagData = null;

export function reset(): void {
    data = null;
}

export function tag(key: string, value: string): void {
    data = { key, value };
    encode(Event.Tag);
}
