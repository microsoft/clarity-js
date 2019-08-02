import { Event } from "@clarity-types/data";
import { IResizeViewport } from "@clarity-types/viewport";
import { bind } from "@src/core/event";
import queue from "@src/core/queue";
import time from "@src/core/time";
import encode from "./encode";

let data: IResizeViewport;

export function start(): void {
    bind(window, "resize", recompute);
    recompute();
}

function recompute(): void {
    data = {
        width: "innerWidth" in window ? window.innerWidth : document.documentElement.clientWidth,
        height: "innerHeight" in window ? window.innerHeight : document.documentElement.clientHeight,
        updated: true
    };
    queue(time(), Event.Resize, encode(Event.Resize));
}

export function summarize(): IResizeViewport {
    return data.updated ? data : null;
}
