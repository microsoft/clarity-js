import { Event } from "@clarity-types/data";
import { SelectionData } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import { getId } from "@src/layout/dom";
import encode from "./encode";

export let data: SelectionData = null;
let selection: Selection = null;
let timeout: number = null;

export function start(): void {
    reset();
    bind(document, "selectstart", recompute, true);
    bind(document, "selectionchange", recompute, true);
}

function recompute(): void {
    let s = document.getSelection();

    // Bail out if we don't have a valid selection
    if (s === null) { return; }

    let anchorNode = getId(s.anchorNode);
    let focusNode = getId(s.focusNode);

    // Bail out if we got valid selection but not valid nodes
    if (anchorNode === null && focusNode === null) { return; }

    if (selection !== null && data.start !== null && data.start !== anchorNode) {
        clearTimeout(timeout);
        encode(Event.Selection);
    }

    data = {
        start: anchorNode,
        startOffset: s.anchorOffset,
        end: focusNode,
        endOffset: s.focusOffset
    };
    selection = s;

    clearTimeout(timeout);
    timeout = window.setTimeout(encode, config.lookahead, Event.Selection);
}

export function reset(): void {
    selection = null;
    data = { start: 0, startOffset: 0, end: 0, endOffset: 0 };
}

export function end(): void {
    reset();
    clearTimeout(timeout);
}
