import { Event } from "@clarity-types/data";
import { IBrokenImageData } from "@clarity-types/diagnostic";
import { bind } from "@src/core/event";
import { getId } from "@src/layout/dom";
import encode from "./encode";

export let data: IBrokenImageData[] = [];

export function start(): void {
    bind(document, "error", handler, true);
}

function handler(error: ErrorEvent): void {
    let target = error.target as HTMLElement;
    if (target && target.tagName === "IMG") {
        data.push({
            source: error["filename"],
            target: getId(target)
        });
    }

    encode(Event.ImageError);
}

export function reset(): void {
    data = [];
}
