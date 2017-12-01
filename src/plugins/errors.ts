import { IJsErrorEventState, Instrumentation, IPlugin } from "../../clarity";
import { bind, instrument } from "../core";
import * as instrumentationCoverters from "./../converters/instrumentation";

export default class ErrorMonitor implements IPlugin {

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

export function logError(errorToLog: Event) {
    // if errorToLog["error"] doesn't exist, occasionally we can get information directly from errorToLog
    let error = errorToLog["error"] || errorToLog;
    let source = errorToLog["filename"];
    let lineno = errorToLog["lineno"];
    let colno = errorToLog["colno"];
    let message = error.message;
    let stack = error.stack;

    let jsErrorEventData: IJsErrorEventData = {
        type: Instrumentation.JsError,
        message,
        stack,
        lineno,
        colno,
        source
    };
    instrument(jsErrorEventData, instrumentationCoverters.jsErrorToArray);
}
