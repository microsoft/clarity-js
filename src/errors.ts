import { register } from "./core";
import { instrument } from "./instrumentation";

let regexEscape = (str) => str.replace(/([.?*+^$&[\]\\(){}|<>-])/g, "\\$1");

export function logError(errorToLog) {
    // if errorToLog["error"] doesn't exist, occasionally we can get information directly from e
    let error = errorToLog["error"] || errorToLog;
    // this is a default value to indicate the object passed to us had no message member
    let defaultMessage = "noMessage";
    let source = errorToLog["filename"];
    let lineno = errorToLog["lineno"];
    let colno = errorToLog["colno"];
    let message = error.message || defaultMessage;
    let stack = error.stack;
    let hrefRegex = new RegExp(regexEscape(location.href), "g");

    if (stack) {
        // ---------------------------------------------------------------------------------------------------------------------
        // the stack has the potential to be very long with a lot of repeated filenames. The following is a small compression to
        // reduce the number of bits over the wire and make the stack easier to display
        // ---------------------------------------------------------------------------------------------------------------------
        let sourceFileRegex = /\(([^\)]+):[0-9]+:[0-9]+\)/g;
        let fileNameFromStack = sourceFileRegex.exec(stack);
        let fileNameCounts = {};
        while (fileNameFromStack !== null) {
            let currentFileName = fileNameFromStack[1];
            if (fileNameCounts[currentFileName]) {
                fileNameCounts[currentFileName]++;
            } else {
                fileNameCounts[currentFileName] = 1;
            }
            fileNameFromStack = sourceFileRegex.exec(stack);
        }

        let regex;
        let replacedCount = 0;
        for (let potentialCompressable in fileNameCounts) {
            // if a particular file has shown up more than once in the stack, it's wortwhile to compress it
            // otherwise we can leave it alone
            if (fileNameCounts[potentialCompressable] > 1) {
                let escapedFileName = regexEscape(potentialCompressable);
                regex = new RegExp(escapedFileName, "g");
                stack = stack.replace(regex, replacedCount);
                // adding in a mapping at the end of our stack to see which condensed files are which
                stack += "#" + replacedCount + "=" + escapedFileName;
                replacedCount++;
            }
        }
        stack = stack.replace(hrefRegex, "self").replace(/"/g, "");
        // end of compression
    }

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

class ErrorMonitor implements IComponent {

    private errorCount: number;

    public activate() {
        window.addEventListener("error", logError, false);
    }

    public reset(): void {
        return;
    }

    public teardown() {
        return;
    }
}

register(new ErrorMonitor());
