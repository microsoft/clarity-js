import { Event } from "@clarity-types/data";
import { IUnload } from "@clarity-types/interaction";
import { end } from "@src/clarity";
import { bind } from "@src/core/event";
import encode from "./encode";

export let data: IUnload;

export function start(): void {
    bind(window, "beforeunload", recompute);
    bind(window, "unload", recompute);
    bind(window, "pagehide", recompute);
}

function recompute(evt: UIEvent): void {
    data = { name: evt.type };
    encode(Event.Unload);
    end();
}

export function reset(): void {
    data = null;
}
