import { Event } from "@clarity-types/data";
import { SelectionData } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import { getId } from "@src/layout/dom";
import encode from "./encode";

export let data: SelectionData = null;
let previous: Selection = null;
let timeout: number = null;

export function start(): void {
    reset();
    bind(document, "selectstart", recompute, true);
    bind(document, "selectionchange", recompute, true);
}

function recompute(): void {
    let current = document.getSelection();

    // Bail out if we don't have a valid selection
    if (current === null) { return; }

    let anchorNode = getId(current.anchorNode);
    let focusNode = getId(current.focusNode);

    // Bail out if we got valid selection but not valid nodes
    // In Edge, selectionchange gets fired even on interactions like right clicks and
    // can result in null anchorNode and focusNode if there was no previous selection on page
    if (anchorNode === null && focusNode === null) { return; }

    if (previous !== null && data.start !== null && data.start !== anchorNode) {
        clearTimeout(timeout);
        encode(Event.Selection);
    }

    data = {
        start: anchorNode,
        startOffset: current.anchorOffset,
        end: focusNode,
        endOffset: current.focusOffset
    };
    previous = current;

    clearTimeout(timeout);
    timeout = window.setTimeout(encode, config.lookahead, Event.Selection);
}

export function reset(): void {
    previous = null;
    data = { start: 0, startOffset: 0, end: 0, endOffset: 0 };
}

export function end(): void {
    reset();
    clearTimeout(timeout);
}
