import { Event } from "@clarity-types/data";
import { InputChangeData } from "@clarity-types/interaction";
import { bind } from "@src/core/event";
import mask from "@src/core/mask";
import { schedule } from "@src/core/task";
import { get } from "@src/layout/dom";
import encode from "./encode";

export let data: InputChangeData;

export function start(): void {
    bind(document, "change", recompute, true);
}

function recompute(evt: UIEvent): void {
    let input = evt.target as HTMLInputElement;
    let value = get(input);
    if (input && value) {
        data = { target: input, value: value.metadata.masked ? mask(input.value) : input.value };
        schedule(encode.bind(this, Event.InputChange));
    }
}

export function reset(): void {
    data = null;
}
