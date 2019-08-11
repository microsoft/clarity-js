import { Event, Flush } from "@clarity-types/data";
import { IDocumentSize } from "@clarity-types/viewport";
import time from "@src/core/time";
import queue from "@src/data/queue";
import encode from "./encode";

let data: IDocumentSize;

export function start(): void {
    recompute();
}

function recompute(): void {
    let body = document.body;
    let doc = document.documentElement;
    let bodyClientHeight = body ? body.clientHeight : null;
    let bodyScrollHeight = body ? body.scrollHeight : null;
    let bodyOffsetHeight = body ? body.offsetHeight : null;
    let documentClientHeight = doc ? doc.clientHeight : null;
    let documentScrollHeight = doc ? doc.scrollHeight : null;
    let documentOffsetHeight = doc ? doc.offsetHeight : null;
    let documentHeight = Math.max(bodyClientHeight, bodyScrollHeight, bodyOffsetHeight,
    documentClientHeight, documentScrollHeight, documentOffsetHeight);

    data = {
        width: body ? body.clientWidth : null,
        height: documentHeight,
        updated: true
    };

    queue(time(), Event.Document, encode(Event.Document), Flush.None);
}

export function compute(): void {
    recompute();
}

export function summarize(): IDocumentSize {
    return data.updated ? data : null;
}
