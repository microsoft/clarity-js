import * as metadata from "@src/data/metadata";
import * as ping from "@src/data/ping";
import * as upload from "@src/data/upload";

export function start(): void {
    upload.start();
    metadata.start();
    ping.start();
}

export function end(): void {
    ping.end();
    upload.end();
    metadata.end();
}
