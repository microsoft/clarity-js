import * as metadata from "@src/data/metadata";
import * as metric from "@src/data/metric";
import * as ping from "@src/data/ping";
import * as tag from "@src/data/tag";
import * as upload from "@src/data/upload";

export function start(): void {
    upload.start();
    metric.start();
    metadata.start();
    ping.start();
    tag.reset();
}

export function end(): void {
    tag.reset();
    ping.end();
    upload.end();
    metadata.end();
    metric.end();
}
