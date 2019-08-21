import { Event } from "@clarity-types/data";
import { IScrollViewport } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import queue from "@src/data/queue";
import encode from "./encode";

let data: IScrollViewport[] = [];
let timeout: number = null;

export function start(): void {
    bind(window, "scroll", recompute);
    recompute();
}

function recompute(): void {
    let x = "pageXOffset" in window ? window.pageXOffset : document.documentElement.scrollLeft;
    let y = "pageYOffset" in window ? window.pageYOffset : document.documentElement.scrollTop;
    data.push({ time: time(), x, y });
    if (timeout) { clearTimeout(timeout); }
    timeout = window.setTimeout(schedule, config.lookahead);
}

function schedule(): void {
    queue(encode(Event.Scroll));
}

export function reset(): void {
    data = [];
}

export function summarize(): IScrollViewport[] {
    let summary: IScrollViewport[] = [];
    let last = null;
    for (let i = 0; i < data.length; i++) {
        let entry = data[i];
        let isFirst = i === 0;
        let isLast = i === data.length - 1;
        if (isFirst || isLast || checkDistance(last, entry)) {
            summary.push(entry);
            last = entry;
        }
    }
    return summary;
}

function checkDistance(last: IScrollViewport, current: IScrollViewport): boolean {
    let dx = last.x - current.x;
    let dy = last.y - current.y;
    return (dx * dx + dy * dy > config.distance * config.distance);
}
