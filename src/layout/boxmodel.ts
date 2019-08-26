import { Event, Token } from "@clarity-types/data";
import { IBoxModel } from "@clarity-types/layout";
import { Metric } from "@clarity-types/metric";
import config from "@src/core/config";
import * as task from "@src/core/task";
import queue from "@src/data/queue";
import encode from "@src/layout/encode";
import * as dom from "./dom";

let bm: {[key: number]: IBoxModel} = {};
let updates: number[] = [];
let timeout: number = null;

export function compute(): void {
    if (timeout) { clearTimeout(timeout); }
    timeout = window.setTimeout(schedule, config.lookahead);
}

function schedule(): void {
    boxmodel().then((data: Token[]) => {
        queue(data);
    });
}

async function boxmodel(): Promise<Token[]> {
    let timer = Metric.BoxModelTime;
    task.start(timer);
    let values = dom.getLeafNodes();
    let doc = document.documentElement;
    let x = "pageXOffset" in window ? window.pageXOffset : doc.scrollLeft;
    let y = "pageYOffset" in window ? window.pageYOffset : doc.scrollTop;

    for (let value of values) {
        if (task.longtask(timer)) {
            await task.idle(timer);
            x = "pageXOffset" in window ? window.pageXOffset : doc.scrollLeft;
            y = "pageYOffset" in window ? window.pageYOffset : doc.scrollTop;
        }
        update(value.id, getLayout(x, y, dom.getNode(value.id) as Element));
    }

    let data = await encode(Event.BoxModel);
    task.stop(timer);
    return data;
}

export function summarize(): IBoxModel[] {
    let summary = [];
    for (let id of updates) {
        summary.push(bm[id]);
    }
    updates = [];
    return summary;
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
        if (updates.indexOf(id) === -1) { updates.push(id); }
        bm[id] = {id, box};
    }
}

/* function getTextLayout(x: number, y: number, textNode: Node): number[] {
    let layout: number[] = [];
    let range = document.createRange();
    range.selectNodeContents(textNode);
    let rects = range.getClientRects();

    for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        layout.push(Math.floor(rect.left + x));
        layout.push(Math.floor(rect.top + y));
        layout.push(Math.floor(rect.width));
        layout.push(Math.floor(rect.height));
    }

    return layout.length > 0 ? layout : [0, 0, 0, 0];
} */

function getLayout(x: number, y: number, element: Element): number[] {
    let layout: number[] = [0, 0, 0, 0];
    let rect = element.getBoundingClientRect();

    if (rect && rect.width > 0 && rect.height > 0) {
        // getBoundingClientRect returns relative positioning to viewport and therefore needs
        // addition of window scroll position to get position relative to document
        // Also: using Math.floor() instead of Math.round() below because in Edge,
        // getBoundingClientRect returns partial pixel values (e.g. 162.5px) and Chrome already
        // floors the value (e.g. 162px). Keeping behavior consistent across
        layout = [
            Math.floor(rect.left + x),
            Math.floor(rect.top + y),
            Math.floor(rect.width),
            Math.floor(rect.height)
        ];
    }
    return layout;
}
