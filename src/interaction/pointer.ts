import { Event } from "@clarity-types/data";
import { PointerData } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import { getId } from "@src/layout/dom";
import encode from "./encode";

export let data: { [key: number]: PointerData[] } = {};
let timeout: number = null;

export function start(): void {
    reset();
    bind(document, "mousedown", mouse.bind(this, Event.MouseDown), true);
    bind(document, "mouseup", mouse.bind(this, Event.MouseUp), true);
    bind(document, "mousemove", mouse.bind(this, Event.MouseMove), true);
    bind(document, "mousewheel", mouse.bind(this, Event.MouseWheel), true);
    bind(document, "dblclick", mouse.bind(this, Event.DoubleClick), true);
    bind(document, "click", mouse.bind(this, Event.Click), true);
    bind(document, "touchstart", touch.bind(this, Event.TouchStart), true);
    bind(document, "touchend", touch.bind(this, Event.TouchEnd), true);
    bind(document, "touchmove", touch.bind(this, Event.TouchMove), true);
    bind(document, "touchcancel", touch.bind(this, Event.TouchCancel), true);
}

function mouse(event: Event, evt: MouseEvent): void {
    let de = document.documentElement;
    let x = "pageX" in evt ? Math.round(evt.pageX) : ("clientX" in evt ? Math.round(evt["clientX"] + de.scrollLeft) : null);
    let y = "pageY" in evt ? Math.round(evt.pageY) : ("clientY" in evt ? Math.round(evt["clientY"] + de.scrollTop) : null);
    let id = evt.target ? getId(evt.target as Node) : null;
    event = event === Event.Click && (evt.buttons === 2 || evt.button === 2) ? Event.RightClick : event;
    handler(event, {target: id, x, y, time: time()});
}

function touch(event: Event, evt: TouchEvent): void {
    let de = document.documentElement;
    let touches = evt.changedTouches;
    let id = evt.target ? getId(evt.target as Node) : null;
    let t = time();
    if (touches) {
        for (let i = 0; i < touches.length; i++) {
            let entry = touches[i];
            let x = "clientX" in entry ? Math.round(entry["clientX"] + de.scrollLeft) : null;
            let y = "clientY" in entry ? Math.round(entry["clientY"] + de.scrollTop) : null;
            handler(event, {target: id, x, y, time: t});
        }
    }
}

function handler(event: Event, current: PointerData): void {
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
    let mouseEvents = [Event.MouseDown, Event.MouseUp, Event.MouseWheel, Event.MouseMove, Event.DoubleClick, Event.Click, Event.RightClick];
    let touchEvents = [Event.TouchStart, Event.TouchMove, Event.TouchEnd, Event.TouchCancel];
    let events = mouseEvents.concat(touchEvents);
    for (let event of events) {
        data[event] = [];
    }
}

function similar(last: PointerData, current: PointerData): boolean {
    let dx = last.x - current.x;
    let dy = last.y - current.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return (distance < config.distance) && (current.time - last.time < config.interval) && current.target === last.target;
}

export function end(): void {
    clearTimeout(timeout);
    data = {};
}
