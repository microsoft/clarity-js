import { Event } from "@clarity-types/data";
import { ClickData } from "@clarity-types/interaction";
import { bind } from "@src/core/event";
import { schedule } from "@src/core/task";
import { link, target, track } from "@src/data/target";
import encode from "./encode";

export let data: ClickData;

export function start(): void {
    bind(document, "click", handler.bind(this, Event.Click), true);
}

function handler(event: Event, evt: MouseEvent): void {
    let de = document.documentElement;
    let x = "pageX" in evt ? Math.round(evt.pageX) : ("clientX" in evt ? Math.round(evt["clientX"] + de.scrollLeft) : null);
    let y = "pageY" in evt ? Math.round(evt.pageY) : ("clientY" in evt ? Math.round(evt["clientY"] + de.scrollTop) : null);
    let t = target(evt);
    // Find nearest anchor tag (<a/>) parent if current target node is part of one
    // If present, we use the returned link element to populate text and link properties below
    let a = link(t);

    // Check for null values before processing this event
    if (x !== null && y !== null) {
        data = {
            target: track(t),
            x,
            y,
            button: evt.button,
            text: a ? a.textContent : null,
            link: a ? a.href : null
        };
        schedule(encode.bind(this, event));
    }
}

export function reset(): void {
    data = null;
}