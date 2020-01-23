import { EncodedPayload, Event, Metric, Token, Transit, UploadData } from "@clarity-types/data";
import config from "@src/core/config";
import measure from "@src/core/measure";
import time from "@src/core/time";
import { clearTimeout, setTimeout } from "@src/core/timeout";
import encode from "@src/data/encode";
import { envelope, metadata } from "@src/data/metadata";
import * as metric from "@src/data/metric";
import * as ping from "@src/data/ping";
import * as target from "@src/data/target";
import * as memory from "@src/performance/memory";

const MAX_RETRIES = 2;
const MAX_BACKUP_BYTES = 10 * 1024 * 1024; // 10MB
let backupBytes: number = 0;
let backup: string[];
let events: string[];
let timeout: number = null;
let transit: Transit;
let active: boolean;
export let track: UploadData;

export function start(): void {
    active = true;
    backupBytes = 0;
    backup = [];
    events = [];
    transit = {};
    track = null;
}

export function queue(data: Token[]): void {
    if (active) {
        let type = data.length > 1 ? data[1] : null;
        let event = JSON.stringify(data);
        let container = events;
        // When transmit is set to true (default), it indicates that we should schedule an upload
        // However, in certain scenarios - like metric calculation - that are triggered as part of an existing upload
        // We do not want to trigger yet another upload, instead enrich the existing outgoing upload.
        // In these cases, we explicitly set transmit to false.
        let transmit = true;

        switch (type) {
            case Event.Target:
                metric.count(Metric.TargetBytes, event.length);
                transmit = false;
                break;
            case Event.Memory:
                metric.count(Metric.PerformanceBytes, event.length);
                transmit = false;
                break;
            case Event.Metric:
            case Event.Upload:
                transmit = false;
                break;
            case Event.Discover:
            case Event.Mutation:
                // Layout events are queued based on the current configuration
                // If lean mode is on, instead of sending these events to server, we back them up in memory.
                // Later, if an upgrade call is called later in the session, we retrieve in memory backup and send them to server.
                // At the moment, we limit backup to grow until MAX_BACKUP_BYTES. Anytime we grow past this size, we start dropping events.
                // This is not ideal, and more of a fail safe mechanism.
                if (config.lean) {
                    transmit = false;
                    backupBytes += event.length;
                    container = backupBytes < MAX_BACKUP_BYTES ? backup : null;
                } else { metric.count(Metric.LayoutBytes, event.length); }
                break;
            case Event.BoxModel:
            case Event.Document:
                metric.count(Metric.LayoutBytes, event.length);
                break;
            case Event.Connection:
            case Event.ContentfulPaint:
            case Event.LongTask:
            case Event.Navigation:
            case Event.Network:
            case Event.Paint:
                metric.count(Metric.PerformanceBytes, event.length);
                break;
            case Event.ScriptError:
            case Event.ImageError:
                break;
            case Event.Upgrade:
                // As part of upgrading experience from lean mode into full mode, we lookup anything that is backed up in memory
                // from previous layout events and get them ready to go out to server as part of next upload.
                for (let entry of backup) {
                    container.push(entry);
                    metric.count(Metric.LayoutBytes, entry.length);
                }
                backup = [];
                backupBytes = 0;
                break;
            default:
                metric.count(Metric.InteractionBytes, event.length);
                break;
        }

        if (container) { container.push(event); }

        // This is a precautionary check acting as a fail safe mechanism to get out of
        // unexpected situations. Ideally, expectation is that pause / resume will work as designed.
        // However, in some cases involving script errors, we may fail to pause Clarity instrumentation.
        // In those edge cases, we will cut the cord after a configurable shutdown value.
        // The only exception is the very last payload, for which we will attempt one final delivery to the server.
        if (time() < config.shutdown && transmit) {
            clearTimeout(timeout);
            timeout = setTimeout(upload, config.delay);
        }
    }
}

export function end(): void {
    clearTimeout(timeout);
    upload(true);
    backupBytes = 0;
    backup = [];
    events = [];
    transit = {};
    track = null;
    active = false;
}

function upload(last: boolean = false): void {
    memory.compute();
    target.compute();
    metric.compute();
    let payload: EncodedPayload = {e: JSON.stringify(envelope(last)), d: `[${events.join()}]`};
    let data = stringify(payload);
    let sequence = metadata.envelope.sequence;
    metric.count(Metric.TotalBytes, data.length);
    send(data, sequence, last);
    if (!last) { ping.reset(); }

    // Send data to upload hook, if defined in the config
    if (config.upload) { config.upload(data, sequence, last); }

    // Clear out events now that payload has been dispatched
    events = [];
}

function stringify(payload: EncodedPayload): string {
    return `{"e":${payload.e},"d":${payload.d}}`;
}

function send(data: string, sequence: number = null, last: boolean = false): void {
    // Upload data if a valid URL is defined in the config
    if (config.url.length > 0) {
        if (last && "sendBeacon" in navigator) {
            navigator.sendBeacon(config.url, data);
        } else {
            if (sequence in transit) { transit[sequence].attempts++; } else { transit[sequence] = { data, attempts: 1 }; }
            let xhr = new XMLHttpRequest();
            xhr.open("POST", config.url);
            if (sequence !== null) { xhr.onreadystatechange = (): void => { measure(check)(xhr, sequence); }; }
            xhr.send(data);
        }
    }
}

function check(xhr: XMLHttpRequest, sequence: number): void {
    if (xhr && xhr.readyState === XMLHttpRequest.DONE && sequence in transit) {
        if ((xhr.status < 200 || xhr.status > 208) && transit[sequence].attempts <= MAX_RETRIES) {
            send(transit[sequence].data, sequence);
        } else {
            track = { sequence, attempts: transit[sequence].attempts, status: xhr.status };
            // Send back an event only if we were not successful in our first attempt
            if (transit[sequence].attempts > 1) { encode(Event.Upload); }
            delete transit[sequence];
        }
    }
}
