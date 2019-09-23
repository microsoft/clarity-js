import { Event } from "@clarity-types/data";
import { IBoxModel } from "@clarity-types/layout";
import { Metric } from "@clarity-types/metric";
import config from "@src/core/config";
import * as task from "@src/core/task";
import encode from "@src/layout/encode";
import * as dom from "./dom";

let bm: {[key: number]: IBoxModel} = {};
let updateMap: number[] = [];
let timeout: number = null;

export function compute(): void {
    clearTimeout(timeout);
    timeout = window.setTimeout(schedule, config.lookahead);
}

function schedule(): void {
    task.schedule(boxmodel);
}

async function boxmodel(): Promise<void> {
    let timer = Metric.BoxModelTime;
    task.start(timer);
    let values = dom.boxmodel();
    let doc = document.documentElement;
    let x = "pageXOffset" in window ? window.pageXOffset : doc.scrollLeft;
    let y = "pageYOffset" in window ? window.pageYOffset : doc.scrollTop;

    for (let value of values) {
        if (task.longtask(timer)) {
            await task.idle(timer);
            x = "pageXOffset" in window ? window.pageXOffset : doc.scrollLeft;
            y = "pageYOffset" in window ? window.pageYOffset : doc.scrollTop;
        }
        update(value.id, layout(dom.getNode(value.id) as Element, x, y));
    }

    if (updateMap.length > 0) { await encode(Event.BoxModel); }
    task.stop(timer);
}

export function updates(): IBoxModel[] {
    let summary = [];
    for (let id of updateMap) {
        summary.push(bm[id]);
    }
    updateMap = [];
    return summary;
}

export function relative(x: number, y: number, element: Element): number[] {
    if (x && x >= 0 && y && y >= 0 && element) {
        let box = layout(element);
        return [x - box[0], y - box[1]];
    }
    return [null, null];
}

function update(id: number, box: number[]): void {
    let changed = true;
    if (id in bm) {
        changed = box.length === bm[id].box.length ? false : true;
        if (changed === false) {
            for (let i = 0; i < box.length; i++) {
                if (box[i] !== bm[id].box[i]) {
                    changed = true;
                    break;
                }
            }
        }
    }

    if (changed) {
        if (updateMap.indexOf(id) === -1) { updateMap.push(id); }
        bm[id] = {id, box};
    }
}

function layout(element: Element, x: number = 0, y: number = 0): number[] {
    let box: number[] = [0, 0, 0, 0];
    let rect = element.getBoundingClientRect();

    if (rect && rect.width > 0 && rect.height > 0) {
        // getBoundingClientRect returns relative positioning to viewport and therefore needs
        // addition of window scroll position to get position relative to document
        // Also: using Math.floor() instead of Math.round() below because in Edge,
        // getBoundingClientRect returns partial pixel values (e.g. 162.5px) and Chrome already
        // floors the value (e.g. 162px). Keeping behavior consistent across
        box = [
            Math.floor(rect.left + x),
            Math.floor(rect.top + y),
            Math.floor(rect.width),
            Math.floor(rect.height)
        ];
    }
    return box;
}

export function reset(): void {
    clearTimeout(timeout);
    updateMap = [];
    bm = {};
}
