import { Event } from "@clarity-types/data";
import { ScrollData } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import { getId } from "@src/layout/dom";
import * as target from "@src/layout/target";
import encode from "./encode";

export let data: ScrollData[] = [];
let timeout: number = null;

export function start(): void {
    bind(window, "scroll", recompute, true);
    recompute();
}

function recompute(event: UIEvent = null): void {
    let eventTarget = event ? (event.target === document ? document.documentElement : event.target) : document.documentElement;
    let x = Math.round((eventTarget as HTMLElement).scrollLeft);
    let y = Math.round((eventTarget as HTMLElement).scrollTop);
    let id = getId(eventTarget as Node);
    let t = time();
    target.observe(id, t);
    let current: ScrollData = {target: id, x, y, time: t};

    let length = data.length;
    let last = length > 1 ? data[length - 2] : null;
    if (last && similar(last, current)) { data.pop(); }
    data.push(current);

    clearTimeout(timeout);
    timeout = window.setTimeout(encode, config.lookahead, Event.Scroll);
}

export function reset(): void {
    data = [];
}

function similar(last: ScrollData, current: ScrollData): boolean {
    let dx = last.x - current.x;
    let dy = last.y - current.y;
    return (dx * dx + dy * dy < config.distance * config.distance) && (current.time - last.time < config.interval);
}

export function end(): void {
    clearTimeout(timeout);
    data = [];
}
