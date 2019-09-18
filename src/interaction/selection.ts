import { Event } from "@clarity-types/data";
import { ISelection } from "@clarity-types/interaction";
import config from "@src/core/config";
import { bind } from "@src/core/event";
import { getId } from "@src/layout/dom";
import encode from "./encode";

export let data: ISelection = null;
let selection: Selection = null;
let timeout: number = null;

export function start(): void {
    reset();
    bind(document, "selectstart", recompute, true);
    bind(document, "selectionchange", recompute, true);
}

function recompute(): void {
    let s = document.getSelection();

    if (selection !== null && data.start !== null && data.start !== getId(s.anchorNode)) {
        clearTimeout(timeout);
        encode(Event.Selection);
    }

    data = {
        start: getId(s.anchorNode),
        startOffset: s.anchorOffset,
        end: getId(s.focusNode),
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
