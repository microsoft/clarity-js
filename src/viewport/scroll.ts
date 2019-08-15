import { Event } from "@clarity-types/data";
import { IScrollViewport } from "@clarity-types/viewport";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import queue from "@src/data/queue";
import encode from "./encode";

let data: IScrollViewport[] = [];
let timeout: number = null;
let timestamp: number = null;

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
    queue(timestamp, Event.Scroll, encode(Event.Scroll));
}

export function reset(): void {
    data = [];
}

export function summarize(): IScrollViewport[] {
    let summary: IScrollViewport[] = [];
    let index = 0;
    let last = null;
    for (let entry of data) {
        let isFirst = index === 0;
        if (isFirst
            || index === data.length - 1
            || checkDistance(last, entry)) {
            timestamp = isFirst ? entry.time : timestamp;
            summary.push(entry);
        }
        index++;
        last = entry;
    }
    return summary;
}

function checkDistance(last: IScrollViewport, current: IScrollViewport): boolean {
    let dx = last.x - current.x;
    let dy = last.y - current.y;
    return (dx * dx + dy * dy > config.distance * config.distance);
}