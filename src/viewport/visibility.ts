import { Event } from "@clarity-types/data";
import { IPageVisibility } from "@clarity-types/viewport";
import { bind, time } from "@src/clarity";
import {queue} from "@src/data/upload";
import serialize from "./serialize";

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
    queue(time(), Event.Visibility, serialize(Event.Visibility));
}

export function summarize(): IPageVisibility {
    return data.updated ? data : null;
}
