import { Event } from "@clarity-types/data";
import { IResizeViewport } from "@clarity-types/viewport";
import { bind, time } from "@src/clarity";
import {queue} from "@src/data/upload";
import serialize from "./serialize";

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
    queue(time(), Event.Resize, serialize(Event.Resize));
}

export function summarize(): IResizeViewport {
    return data.updated ? data : null;
}
