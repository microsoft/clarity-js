import { Event, PingData } from "@clarity-types/data";
import { pause } from "@src/clarity";
import config from "@src/core/config";
import time from "@src/core/time";
import encode from "./encode";

export let data: PingData;
let last = 0;
let interval = 0;
let timeout: number = null;

export function start(): void {
    interval = config.ping;
}

export function reset(): void {
    if (timeout) { clearTimeout(timeout); }
    timeout = window.setTimeout(ping, interval);
}

function ping(): void {
    let now = time();
    data = { gap: now - last };
    encode(Event.Ping);
    if (data.gap < config.timeout) {
        interval = Math.min(interval * 2, config.timeout);
        timeout = window.setTimeout(ping, interval);
    } else { pause(); }

    last = now;
}

export function end(): void {
    clearTimeout(timeout);
    last = 0;
    interval = 0;
}
