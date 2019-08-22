import { Event } from "@clarity-types/data";
import { IResize } from "@clarity-types/interaction";
import { bind } from "@src/core/event";
import queue from "@src/data/queue";
import encode from "./encode";

export let data: IResize;

export function start(): void {
    bind(window, "resize", recompute);
    recompute();
}

function recompute(): void {
    data = {
        width: "innerWidth" in window ? window.innerWidth : document.documentElement.clientWidth,
        height: "innerHeight" in window ? window.innerHeight : document.documentElement.clientHeight
    };
    queue(encode(Event.Resize));
}

export function reset(): void {
    data = null;
}
