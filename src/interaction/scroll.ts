import { Event } from "@clarity-types/data";
import { IScroll, Scroll } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import queue from "@src/data/queue";
import { getId } from "@src/layout/dom";
import encode from "./encode";

let lastX = {};
let lastY = {};
let dataX: IScroll[] = [];
let dataY: IScroll[] = [];
let timeout: number = null;

export function start(): void {
    bind(window, "scroll", recompute, true);
    recompute();
}

function recompute(event: UIEvent = null): void {
    let t = time();
    let eventTarget = event ? (event.target === document ? document.documentElement : event.target) : document.documentElement;
    let target = getId(eventTarget as Node);
    let x = (eventTarget as HTMLElement).scrollLeft;
    let y = (eventTarget as HTMLElement).scrollTop;

    if (x !== lastX[target]) {
        dataX.push({ target, type: Scroll.X, time: t, value: x });
        lastX[target] = x;
    }

    if (y !== lastY[target]) {
        dataY.push({ target, type: Scroll.Y, time: t, value: y });
        lastY[target] = y;
    }

    if (timeout) { clearTimeout(timeout); }
    timeout = window.setTimeout(schedule, config.lookahead);
}

function schedule(): void {
    queue(encode(Event.Scroll));
}

export function reset(): void {
    dataX = [];
    dataY = [];
    lastX = {};
    lastY = {};
}

export function summarize(): IScroll[] {
    let summary: IScroll[] = [];
    let last = null;
    let data = dataX.concat(dataY);
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

function checkDistance(last: IScroll, current: IScroll): boolean {
    let d = last.value - current.value;
    return (d  > config.distance);
}
