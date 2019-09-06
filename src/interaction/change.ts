import { Event } from "@clarity-types/data";
import { IChange } from "@clarity-types/interaction";
import { bind } from "@src/core/event";
import mask from "@src/core/mask";
import { get } from "@src/layout/dom";
import encode from "./encode";

export let data: IChange;

export function start(): void {
    bind(document, "change", recompute, true);
}

function recompute(evt: UIEvent): void {
    let target = evt.target as HTMLInputElement;
    let value = get(target);
    if (target && value) {
        data = { target: value.id, value: value.metadata.masked ? mask(target.value) : target.value };
        encode(Event.Change);
    }
}

export function reset(): void {
    data = null;
}
