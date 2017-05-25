import { instrument } from "./instrumentation";
import { register } from "./core";

class ErrorMonitor implements IComponent {

    private errorCount;

    public activate() {
        this.reset();
        window.addEventListener("error", this.logError, false);        
    }

    public reset(): void {
        this.errorCount = 0;
    }

    public teardown() {        
    }

    private regexEscape = function (str) {
        return str.replace(/([.?*+^$&[\]\\(){}|<>-])/g, "\\$1");
    };

    private logError(errorToLog) {
        this.errorCount++;

        // make this configurable
        if (this.errorCount === 16) {
                errorToLog = new Error("max errors reached");
        }

        // beyond an error threshold, continuing to notify the server of new errors loses meaning. Pages with many errors tend to be stuck in 
        // error loops that originate from an earlier error
        if (this.errorCount > 16) {
            return;
        }

        // if e["error"] doesn't exist, occasionally we can get information directly from e
        var error = errorToLog["error"] || errorToLog;
        // this is a default value to indicate the object passed to us had no message member (which we would put in the Text field of the error payload)
        var defaultMessage = "noMessage";
        var fileName = errorToLog["filename"];
        var lineno = errorToLog["lineno"];
        var colno = errorToLog["colno"];
        var message = error.message || defaultMessage;
        var stack = error.stack;
        var hrefRegex = new RegExp(this.regexEscape(location.href), "g");

        if (stack) {
            // ---------------------------------------------------------------------------------------------------------------------
            // the stack has the potential to be very long with a lot of repeated filenames. The following is a small compression to
            // reduce the number of bits over the wire and make the stack easier to display 
            // ---------------------------------------------------------------------------------------------------------------------
            var sourceFileRegex = /\(([^\)]+):[0-9]+:[0-9]+\)/g;
            var fileNameFromStack;
            var fileNameCounts = {};
            while ((fileNameFromStack = sourceFileRegex.exec(stack)) !== null) {
                var currentFileName = fileNameFromStack[1];
                if (fileNameCounts[currentFileName]) {
                    fileNameCounts[currentFileName]++;
                } else {
                    fileNameCounts[currentFileName] = 1;
                }
            }

            var regex;
            var replacedCount = 0;
            for (var potentialCompressable in fileNameCounts) {
                // if a particular file has shown up more than once in the stack, it's wortwhile to compress it - otherwise we can leave it alone
                if (fileNameCounts[potentialCompressable] > 1) {
                    var escapedFileName = this.regexEscape(potentialCompressable);
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
            message: message,
            stack: stack,
            lineno: lineno,
            colno: colno,
            source: fileName
        }
        instrument(jsErrorEventState);
    }
}

register(new ErrorMonitor());