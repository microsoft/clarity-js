import { Event } from "@clarity-types/data";
import { IPointer } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import * as boxmodel from "@src/layout/boxmodel";
import { getId } from "@src/layout/dom";
import encode from "./encode";

export let data: { [key: number]: IPointer[] } = {};
let timeout: number = null;

export function start(): void {
    reset();
    bind(document, "mousedown", mouse.bind(this, Event.MouseDown));
    bind(document, "mouseup", mouse.bind(this, Event.MouseUp));
    bind(document, "mousemove", mouse.bind(this, Event.MouseMove));
    bind(document, "mousewheel", mouse.bind(this, Event.MouseWheel));
    bind(document, "dblclick", mouse.bind(this, Event.DoubleClick));
    bind(document, "click", mouse.bind(this, Event.Click));
    bind(document, "touchstart", touch.bind(this, Event.TouchStart));
    bind(document, "touchend", touch.bind(this, Event.TouchEnd));
    bind(document, "touchmove", touch.bind(this, Event.TouchMove));
    bind(document, "touchcancel", touch.bind(this, Event.TouchCancel));
}

function mouse(event: Event, evt: MouseEvent): void {
    let de = document.documentElement;
    let x = "pageX" in evt ? Math.round(evt.pageX) : ("clientX" in evt ? Math.round(evt["clientX"] + de.scrollLeft) : null);
    let y = "pageY" in evt ? Math.round(evt.pageY) : ("clientY" in evt ? Math.round(evt["clientY"] + de.scrollTop) : null);
    let target = evt.target ? getId(evt.target as Node) : null;
    let targetX = null; // x coordinate relative to the target element
    let targetY = null; // y coordinate relative to the target element
    if (event === Event.Click) {
        // Populate (x,y) relative to target only when the above condition is met
        // It's an expensive operation and we can expand the scope as desired later
        event = evt.buttons === 2 || evt.button === 2 ? Event.RightClick : event;
        let relative = boxmodel.relative(x, y, evt.target as Element);
        targetX = relative[0];
        targetY = relative[1];
    }
    handler(event, {target, x, y, targetX, targetY, time: time()});
}

function touch(event: Event, evt: TouchEvent): void {
    let de = document.documentElement;
    let touches = evt.changedTouches;
    let target = evt.target ? getId(evt.target as Node) : null;
    if (touches) {
        for (let i = 0; i < touches.length; i++) {
            let t = touches[i];
            let x = "clientX" in t ? Math.round(t["clientX"] + de.scrollLeft) : null;
            let y = "clientY" in t ? Math.round(t["clientY"] + de.scrollTop) : null;
            handler(event, {target, x, y, time: time()});
        }
    }
}

function handler(event: Event, current: IPointer): void {
    switch (event) {
        case Event.MouseMove:
        case Event.MouseWheel:
        case Event.TouchMove:
            let length = data[event].length;
            let last = length > 1 ? data[event][length - 2] : null;
            if (last && similar(last, current)) { data[event].pop(); }
            data[event].push(current);

            clearTimeout(timeout);
            timeout = window.setTimeout(encode, config.lookahead, event);
            break;
        default:
            data[event].push(current);
            encode(event);
            break;
    }
}

export function reset(): void {
    data = {};
    let mouseEvents = [Event.MouseDown, Event.MouseUp, Event.MouseWheel, Event.MouseMove, Event.DoubleClick, Event.Click];
    let touchEvents = [Event.TouchStart, Event.TouchMove, Event.TouchEnd, Event.TouchCancel];
    let events = mouseEvents.concat(touchEvents);
    for (let event of events) {
        data[event] = [];
    }
}

function similar(last: IPointer, current: IPointer): boolean {
    let dx = last.x - current.x;
    let dy = last.y - current.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return (distance < config.distance) && (current.time - last.time < config.interval) && current.target === last.target;
}

export function end(): void {
    clearTimeout(timeout);
    data = {};
}
