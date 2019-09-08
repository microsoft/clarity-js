import * as metadata from "@src/data/metadata";
import * as upload from "@src/data/upload";
export function start(): void {
    upload.start();
    metadata.start();
}

export function end(): void {
    upload.end();
    metadata.end();
}
