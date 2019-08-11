import { Event } from "@clarity-types/data";
import { IPageVisibility } from "@clarity-types/viewport";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import queue from "@src/data/queue";
import encode from "./encode";

let data: IPageVisibility;

export function start(): void {
    bind(window, "pagehide", recompute);
    bind(window, "pageshow", recompute);
    bind(document, "visibilitychange", recompute);
    recompute();
}

function recompute(): void {
    data = {
        visible: "visibilityState" in document ? document.visibilityState : "default",
        updated: true
    };
    queue(time(), Event.Visibility, encode(Event.Visibility));
}

export function summarize(): IPageVisibility {
    return data.updated ? data : null;
}
