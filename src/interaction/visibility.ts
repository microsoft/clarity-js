import { Event } from "@clarity-types/data";
import { VisibileData } from "@clarity-types/interaction";
import { bind } from "@src/core/event";
import encode from "./encode";

export let data: VisibileData;

export function start(): void {
    bind(document, "visibilitychange", recompute);
    recompute();
}

function recompute(): void {
    data = { visible: "visibilityState" in document ? document.visibilityState : "default" };
    encode(Event.Visible);
}

export function reset(): void {
    data = null;
}
