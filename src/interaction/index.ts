import * as mouse from "@src/interaction/mouse";
import * as resize from "@src/interaction/resize";
import * as scroll from "@src/interaction/scroll";
import * as selection from "@src/interaction/selection";
import * as visibility from "@src/interaction/visibility";

export function start(): void {
    mouse.start();
    resize.start();
    visibility.start();
    scroll.start();
    selection.start();
}

export function end(): void {
    // End calls
}
