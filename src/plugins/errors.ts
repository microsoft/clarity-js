import { bind, instrument } from "../core";

export function logError(errorToLog: Event) {
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

class ErrorMonitor implements IPlugin {

    private errorCount: number;

    public activate() {
        bind(window, "error", logError);
    }

    public reset(): void {
        return;
    }

    public teardown() {
        return;
    }
}
