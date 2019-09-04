import { Event } from "@clarity-types/data";
import { IMouse } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import { getId } from "@src/layout/dom";
import encode from "./encode";

export let data: { [key: number]: IMouse[] } = [];
let timeout: number = null;

export function start(): void {
    reset();
    bind(document, "mousedown", handler.bind(this, Event.MouseDown));
    bind(document, "mouseup", handler.bind(this, Event.MouseUp));
    bind(document, "mousemove", handler.bind(this, Event.MouseMove));
    bind(document, "mousewheel", handler.bind(this, Event.MouseWheel));
    bind(document, "dblclick", handler.bind(this, Event.DoubleClick));
    bind(document, "click", handler.bind(this, Event.Click));
}

function handler(event: Event, evt: MouseEvent): void {
    let de = document.documentElement;
    let x = "pageX" in evt ? Math.round(evt.pageX) : ("clientX" in evt ? Math.round(evt["clientX"] + de.scrollLeft) : null);
    let y = "pageY" in evt ? Math.round(evt.pageY) : ("clientY" in evt ? Math.round(evt["clientY"] + de.scrollTop) : null);
    let current = {target: evt.target ? getId(evt.target as Node) : null, x, y, time: time()};
    switch (event) {
        case Event.MouseMove:
        case Event.MouseWheel:
            let length = data[event].length;
            let last = length > 1 ? data[event][length - 2] : null;
            if (last && similar(last, current)) { data[event].pop(); }
            data[event].push(current);

            if (timeout) { clearTimeout(timeout); }
            timeout = window.setTimeout(encode, config.lookahead, event);
            break;
        case Event.Click:
            event = evt.buttons === 2 || evt.button === 2 ? Event.RightClick : event;
        default:
            data[event].push(current);
            encode(event);
            break;
    }
}

export function reset(): void {
    data = {};
    for (let event of [Event.MouseDown, Event.MouseUp, Event.MouseMove, Event.DoubleClick, Event.Click]) {
        data[event] = [];
    }
}

function similar(last: IMouse, current: IMouse): boolean {
    let dx = last.x - current.x;
    let dy = last.y - current.y;
    return (dx * dx + dy * dy < config.distance * config.distance) && (current.time - last.time < config.interval);
}
