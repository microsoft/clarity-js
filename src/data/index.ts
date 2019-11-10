import wrap from "@src/core/wrap";
import * as metadata from "@src/data/metadata";
import * as metric from "@src/data/metric";
import * as ping from "@src/data/ping";
import * as tag from "@src/data/tag";
import * as target from "@src/data/target";
import * as upload from "@src/data/upload";
export { tag } from "@src/data/tag";

export function start(): void {
    metric.start();
    wrap(upload.start)();
    wrap(target.reset)();
    wrap(metadata.start)();
    wrap(ping.start)();
    wrap(tag.reset)();
}

export function end(): void {
    wrap(tag.reset)();
    wrap(ping.end)();
    wrap(upload.end)();
    wrap(target.reset)();
    wrap(metadata.end)();
    metric.end();
}
