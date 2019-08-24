import { Event } from "@clarity-types/data";
import { IMouse, Mouse } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import queue from "@src/data/queue";
import { getId } from "@src/layout/dom";
import encode from "./encode";

let data: IMouse[] = [];
let timeout: number = null;

export function start(): void {
    bind(document, "mousedown", handler.bind(this, Mouse.Down));
    bind(document, "mouseup", handler.bind(this, Mouse.Up));
    bind(document, "mousemove", handler.bind(this, Mouse.Move));
    bind(document, "mousewheel", handler.bind(this, Mouse.Wheel));
    bind(document, "dblclick", handler.bind(this, Mouse.DoubleClick));
    bind(document, "click", handler.bind(this, Mouse.Click));
}

function handler(type: Mouse, evt: MouseEvent): void {
    let de = document.documentElement;
    data.push({
        type,
        target: evt.target ? getId(evt.target as Node) : null,
        time: time(),
        x: "pageX" in evt ? Math.round(evt.pageX) : ("clientX" in evt ? Math.round(evt["clientX"] + de.scrollLeft) : null),
        y: "pageY" in evt ? Math.round(evt.pageY) : ("clientY" in evt ? Math.round(evt["clientY"] + de.scrollTop) : null),
        buttons: evt.buttons
    });
    if (timeout) { clearTimeout(timeout); }
    timeout = window.setTimeout(schedule, config.lookahead);
}

function schedule(): void {
    queue(encode(Event.Mouse));
}

export function reset(): void {
    data = [];
}

export function summarize(): IMouse[] {
    let summary: IMouse[] = [];
    let index = 0;
    let last = null;
    for (let entry of data) {
        let isFirst = index === 0;
        if (isFirst
            || index === data.length - 1
            || checkDistance(last, entry)) {
            summary.push(entry);
        }
        index++;
        last = entry;
    }
    return summary;
}

function checkDistance(last: IMouse, current: IMouse): boolean {
    let dx = last.x - current.x;
    let dy = last.y - current.y;
    return (dx * dx + dy * dy > config.distance * config.distance);
}
