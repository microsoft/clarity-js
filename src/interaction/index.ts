import * as input from "@src/interaction/input";
import * as pointer from "@src/interaction/pointer";
import * as resize from "@src/interaction/resize";
import * as scroll from "@src/interaction/scroll";
import * as selection from "@src/interaction/selection";
import * as unload from "@src/interaction/unload";
import * as visibility from "@src/interaction/visibility";

export function start(): void {
    input.start();
    pointer.start();
    resize.start();
    visibility.start();
    scroll.start();
    selection.start();
    unload.start();
}

export function end(): void {
    pointer.end();
    scroll.end();
    selection.end();
}
