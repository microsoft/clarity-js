import { Event } from "@clarity-types/data";
import { IScrollViewport } from "@clarity-types/viewport";
import { bind, time } from "@src/core";
import {queue} from "@src/data/upload";
import serialize from "./serialize";

let data: IScrollViewport[] = [];
let wait = 1000;
let distance = 20;
let timeout: number = null;
let timestamp: number = null;

export function activate(): void {
    bind(window, "scroll", recompute);
    recompute();
}

function recompute(): void {
    let x = "pageXOffset" in window ? window.pageXOffset : document.documentElement.scrollLeft;
    let y = "pageYOffset" in window ? window.pageYOffset : document.documentElement.scrollTop;
    data.push({time: time(), x, y, updated: true});
    if (timeout) { clearTimeout(timeout); }
    timeout = window.setTimeout(schedule, wait);
}

function schedule(): void {
    queue(timestamp, Event.Scroll, serialize(Event.Scroll));
}

export function summarize(): IScrollViewport[] {
    let summary: IScrollViewport[] = [];
    let index = 0;
    let last = null;
    for (let entry of data) {
        if (entry.updated) {
            let isFirst = index === 0;
            if (isFirst
                || index === data.length - 1
                || checkDistance(last, entry)) {
                timestamp = isFirst ? entry.time : timestamp;
                summary.push(entry);
            }
            index++;
            entry.updated = false;
            last = entry;
        }
    }
    return summary;
}

function checkDistance(last: IScrollViewport, current: IScrollViewport): boolean {
    let dx = last.x - current.x;
    let dy = last.y - current.y;
    return (dx * dx + dy * dy > distance * distance);
}
