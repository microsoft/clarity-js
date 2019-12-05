import { Event } from "@clarity-types/data";
import { PointerState } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import { schedule } from "@src/core/task";
import time from "@src/core/time";
import { clearTimeout, setTimeout } from "@src/core/timeout";
import encode from "./encode";

export let state: PointerState[] = [];
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
    let target = evt.target ? evt.target as Node : null;
    event = event === Event.Click && (evt.buttons === 2 || evt.button === 2) ? Event.RightClick : event;
    // Check for null values before processing this event
    if (x !== null && y !== null) { handler({ time: time(), event, data: { target, x, y } }); }
}

function touch(event: Event, evt: TouchEvent): void {
    let de = document.documentElement;
    let touches = evt.changedTouches;
    let target = evt.target ? evt.target as Node : null;
    let t = time();
    if (touches) {
        for (let i = 0; i < touches.length; i++) {
            let entry = touches[i];
            let x = "clientX" in entry ? Math.round(entry["clientX"] + de.scrollLeft) : null;
            let y = "clientY" in entry ? Math.round(entry["clientY"] + de.scrollTop) : null;
            // Check for null values before processing this event
            if (x !== null && y !== null) { handler({ time: t, event, data: { target, x, y } }); }
        }
    }
}

function handler(current: PointerState): void {
    switch (current.event) {
        case Event.MouseMove:
        case Event.MouseWheel:
        case Event.TouchMove:
            let length = state.length;
            let last = length > 1 ? state[length - 2] : null;
            if (last && similar(last, current)) { state.pop(); }
            state.push(current);

            clearTimeout(timeout);
            timeout = setTimeout(process, config.lookahead, current.event);
            break;
        default:
            state.push(current);
            process(current.event);
            break;
    }
}

function process(event: Event): void {
    schedule(encode.bind(this, event));
}

export function reset(): void {
    state = [];
}

function similar(last: PointerState, current: PointerState): boolean {
    let dx = last.data.x - current.data.x;
    let dy = last.data.y - current.data.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let gap = current.time - last.time;
    return current.event === last.event && distance < config.distance && gap < config.interval && current.data.target === last.data.target;
}

export function end(): void {
    clearTimeout(timeout);
    // Send out any pending pointer events in the pipeline
    if (state.length > 0) { process(state[state.length - 1].event); }
}
