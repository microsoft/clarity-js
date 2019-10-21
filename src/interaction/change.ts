import { Event } from "@clarity-types/data";
import { InputChangeData } from "@clarity-types/interaction";
import { bind } from "@src/core/event";
import mask from "@src/core/mask";
import { get } from "@src/layout/dom";
import * as target from "@src/layout/target";
import encode from "./encode";

export let data: InputChangeData;

export function start(): void {
    bind(document, "change", recompute, true);
}

function recompute(evt: UIEvent): void {
    let input = evt.target as HTMLInputElement;
    let value = get(input);
    if (input && value) {
        target.observe(value.id);
        data = { target: value.id, value: value.metadata.masked ? mask(input.value) : input.value };
        encode(Event.InputChange);
    }
}

export function reset(): void {
    data = null;
}
