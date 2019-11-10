import { Event } from "@clarity-types/data";
import wrap from "./wrap";

export function setTimeout(handler: (event?: Event | boolean) => void, timeout: number, event?: Event): number {
    return window.setTimeout(wrap(handler), timeout, event);
}

export function clearTimeout(handle: number): void {
    return window.clearTimeout(handle);
}
