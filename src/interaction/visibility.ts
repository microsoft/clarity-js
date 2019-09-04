import { Event } from "@clarity-types/data";
import { IPageVisibility } from "@clarity-types/interaction";
import { bind } from "@src/core/event";
import encode from "./encode";

export let data: IPageVisibility;

export function start(): void {
    bind(window, "pagehide", recompute);
    bind(window, "pageshow", recompute);
    bind(document, "visibilitychange", recompute);
    recompute();
}

function recompute(): void {
    data = { visible: "visibilityState" in document ? document.visibilityState : "default" };
    encode(Event.Visibility);
}

export function reset(): void {
    data = null;
}
