import { Event } from "@clarity-types/data";
import { ScrollState } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import { schedule } from "@src/core/task";
import time from "@src/core/time";
import { clearTimeout, setTimeout } from "@src/core/timeout";
import encode from "./encode";

export let state: ScrollState[] = [];
let timeout: number = null;

export function start(): void {
    state = [];
    bind(window, "scroll", recompute, true);
    recompute();
}

function recompute(event: UIEvent = null): void {
    let de = document.documentElement;
    let target = event ? (event.target === document ? de : event.target) as HTMLElement : de;
    // Edge doesn't support scrollTop position on document.documentElement.
    // For cross browser compatibility, looking up pageYOffset on window if the scroll is on document.
    // And, if for some reason that is not available, fall back to looking up scrollTop on document.documentElement.
    let x = target === de && "pageXOffset" in window ? Math.round(window.pageXOffset) : Math.round(target.scrollLeft);
    let y = target === de && "pageYOffset" in window ? Math.round(window.pageYOffset) : Math.round(target.scrollTop);
    let current: ScrollState = { time: time(), event: Event.Scroll, data: {target, x, y} };

    // We don't send any scroll events if this is the first event and the current position is top (0,0)
    if (event === null && x === 0 && y === 0) { return; }

    let length = state.length;
    let last = length > 1 ? state[length - 2] : null;
    if (last && similar(last, current)) { state.pop(); }
    state.push(current);

    clearTimeout(timeout);
    timeout = setTimeout(process, config.lookahead, Event.Scroll);
}

export function reset(): void {
    state = [];
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
    state = [];
}
