import { EncodedPayload, Event, Metric, Token, Transit, UploadData } from "@clarity-types/data";
import config from "@src/core/config";
import time from "@src/core/time";
import encode from "@src/data/encode";
import { envelope, metadata } from "@src/data/metadata";
import * as metric from "@src/data/metric";
import * as ping from "@src/data/ping";

const MAX_RETRIES = 2;
let events: string[];
let timeout: number = null;
let transit: Transit;
let active: boolean;
export let track: UploadData;

export function start(): void {
    active = true;
    events = [];
    transit = {};
    track = null;
}

export function queue(data: Token[]): void {
    if (active) {
        let type = data.length > 1 ? data[1] : null;
        let event = JSON.stringify(data);
        events.push(event);

        switch (type) {
            case Event.Metric:
            case Event.Upload:
                return; // do not schedule upload callback
            case Event.Discover:
            case Event.Mutation:
            case Event.BoxModel:
            case Event.Hash:
            case Event.Document:
            case Event.Target:
                metric.counter(Metric.LayoutBytes, event.length);
                break;
            case Event.Network:
            case Event.Performance:
                metric.counter(Metric.NetworkBytes, event.length);
                break;
            case Event.ScriptError:
            case Event.ImageError:
                metric.counter(Metric.DiagnosticBytes, event.length);
                break;
            default:
                metric.counter(Metric.InteractionBytes, event.length);
                break;
        }

        // This is a precautionary check acting as a fail safe mechanism to get out of
        // unexpected situations. Ideally, expectation is that pause / resume will work as designed.
        // However, in some cases involving script errors, we may fail to pause Clarity instrumentation.
        // In those edge cases, we will cut the cord after a configurable shutdown value.
        // The only exception is the very last payload, for which we will attempt one final delivery to the server.
        if (time() < config.shutdown) {
            clearTimeout(timeout);
            timeout = window.setTimeout(upload, config.delay);
        }
    }
}

export function end(): void {
    clearTimeout(timeout);
    upload(true);
    events = [];
    transit = {};
    track = null;
    active = false;
}

function upload(last: boolean = false): void {
    metric.compute();
    let payload: EncodedPayload = {e: JSON.stringify(envelope(last)), d: `[${events.join()}]`};
    let data = stringify(payload);
    let sequence = metadata.envelope.sequence;
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
            if (sequence !== null) { xhr.onreadystatechange = (): void => { check(xhr, sequence); }; }
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
            encode(Event.Upload);
            delete transit[sequence];
        }
    }
}
