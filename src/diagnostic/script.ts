import { Event } from "@clarity-types/data";
import { ScriptErrorData } from "@clarity-types/diagnostic";
import { bind } from "@src/core/event";
import encode from "./encode";

export let data: ScriptErrorData[] = [];

export function start(): void {
    bind(window, "error", handler);
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

    encode(Event.ScriptError);
}

export function reset(): void {
    data = [];
}
