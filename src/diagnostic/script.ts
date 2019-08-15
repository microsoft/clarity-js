import { Event } from "@clarity-types/data";
import { IScriptError } from "@clarity-types/diagnostic";
import { bind } from "@src/core/event";
import time from "@src/core/time";
import queue from "@src/data/queue";
import encode from "./encode";

export let data: IScriptError[] = [];

export function start(): void {
    bind(window, "error", handler);
}

export function end(): void {
    return;
}

function handler(error: ErrorEvent): void {
    let e = error["error"] || error;

    data.push({
        message: e.message,
        stack: e.stack,
        line: error["lineno"],
        column: error["colno"],
        source: error["filename"]
    });

    queue(time(), Event.ScriptError, encode(Event.ScriptError));
}

export function reset(): void {
    data = [];
}
