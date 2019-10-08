import { Event } from "@clarity-types/data";
import { ImageErrorData } from "@clarity-types/diagnostic";
import { bind } from "@src/core/event";
import { getId } from "@src/layout/dom";
import encode from "./encode";

export let data: ImageErrorData;

export function start(): void {
    bind(document, "error", handler, true);
}

function handler(error: ErrorEvent): void {
    let target = error.target as HTMLElement;
    if (target && target.tagName === "IMG") {
        data = {
            source: (target as HTMLImageElement).src,
            target: getId(target)
        };
    }

    encode(Event.ImageError);
}
