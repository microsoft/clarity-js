import { Event } from "@clarity-types/data";
import { ScrollState } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import { schedule } from "@src/core/task";
import time from "@src/core/time";
import { clearTimeout, setTimeout } from "@src/core/timeout";
import encode from "./encode";

export let data: ScrollState[] = [];
let timeout: number = null;

export function start(): void {
    bind(window, "scroll", recompute, true);
    recompute();
}

function recompute(event: UIEvent = null): void {
    let target = event ? (event.target === document ? document.documentElement : event.target) as HTMLElement : document.documentElement;
    let x = Math.round(target.scrollLeft);
    let y = Math.round(target.scrollTop);
    let current: ScrollState = { time: time(), event: Event.Scroll, data: {target, x, y} };

    // We don't send any scroll events if this is the first event and the current position is top (0,0)
    if (event === null && x === 0 && y === 0) { return; }

    let length = data.length;
    let last = length > 1 ? data[length - 2] : null;
    if (last && similar(last, current)) { data.pop(); }
    data.push(current);

    clearTimeout(timeout);
    timeout = setTimeout(process, config.lookahead, Event.Scroll);
}

export function reset(): void {
    data = [];
}

function process(event: Event): void {
    schedule(encode.bind(this, event));
}

function similar(last: ScrollState, current: ScrollState): boolean {
    let dx = last.data.x - current.data.x;
    let dy = last.data.y - current.data.y;
    return (dx * dx + dy * dy < config.distance * config.distance) && (current.time - last.time < config.interval);
}

export function end(): void {
    clearTimeout(timeout);
    data = [];
}
