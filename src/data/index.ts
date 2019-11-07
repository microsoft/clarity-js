import * as metadata from "@src/data/metadata";
import * as metric from "@src/data/metric";
import * as ping from "@src/data/ping";
import * as tag from "@src/data/tag";
import * as target from "@src/data/target";
import * as upload from "@src/data/upload";
export { tag } from "@src/data/tag";

export function start(): void {
    upload.start();
    target.reset();
    metric.start();
    metadata.start();
    ping.start();
    tag.reset();
}

export function end(): void {
    tag.reset();
    ping.end();
    upload.end();
    target.reset();
    metadata.end();
    metric.end();
}
