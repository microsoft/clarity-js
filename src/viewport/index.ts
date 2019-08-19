import * as document from "@src/viewport/document";
import * as resize from "@src/viewport/resize";
import * as scroll from "@src/viewport/scroll";
import * as visibility from "@src/viewport/visibility";

export function start(): void {
    document.start();
    resize.start();
    visibility.start();
    scroll.start();
}

export function end(): void {
    // End calls
}
