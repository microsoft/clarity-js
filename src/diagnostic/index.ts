import * as image from "./image";
import * as script from "./script";

export function start(): void {
    script.start();
    image.start();
}

export function end(): void {
    script.end();
    image.end();
}
