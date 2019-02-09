import { IPlugin } from "@clarity-types/core";
import { IJsErrorEventState, Instrumentation } from "@clarity-types/instrumentation";
import { bind, instrument } from "@src/core";

export default class ErrorMonitor implements IPlugin {

    public activate(): void {
        bind(window, "error", logError);
    }

    public reset(): void {
        return;
    }

    public teardown(): void {
        return;
    }
}

export function logError(errorToLog: Event): void {
    // if errorToLog["error"] doesn't exist, occasionally we can get information directly from errorToLog
    let error = errorToLog["error"] || errorToLog;
    let source = errorToLog["filename"];
    let lineno = errorToLog["lineno"];
    let colno = errorToLog["colno"];
    let message = error.message;
    let stack = error.stack;

    let jsErrorEventState: IJsErrorEventState = {
        type: Instrumentation.JsError,
        message,
        stack,
        lineno,
        colno,
        source
    };
    instrument(jsErrorEventState);
}
