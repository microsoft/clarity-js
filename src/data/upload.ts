import { EncodedPayload, Event, Metric, Token, Transit, UploadData } from "@clarity-types/data";
import config from "@src/core/config";
import encode from "@src/data/encode";
import { envelope, metadata } from "@src/data/metadata";
import * as metric from "@src/data/metric";
import * as ping from "@src/data/ping";

const MAX_RETRIES = 2;
let events: string[];
let timeout: number = null;
let transit: Transit;
export let track: UploadData;

export function start(): void {
    events = [];
    transit = {};
    track = null;
    recover();
}

export function queue(data: Token[]): void {
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

    clearTimeout(timeout);
    timeout = window.setTimeout(upload, config.delay);
}

export function end(): void {
    clearTimeout(timeout);
    upload(true);
    events = [];
    transit = {};
    track = null;
}

function upload(last: boolean = false): void {
    metric.compute();
    let handler = config.upload ? config.upload : send;
    let payload: EncodedPayload = {e: JSON.stringify(envelope(last)), d: `[${events.join()}]`};
    handler(stringify(payload), metadata.envelope.sequence, last);
    if (last) { backup(payload); } else { ping.reset(); }
    events = [];
}

function stringify(payload: EncodedPayload): string {
    return `{"e":${payload.e},"d":${payload.d}}`;
}

function send(data: string, sequence: number = null, last: boolean = false): void {
    if (config.url.length > 0) {
        if (last && "sendBeacon" in navigator) {
            navigator.sendBeacon(config.url, data);
        } else {
            transit[sequence] = { data, attempts: 1 };
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
            transit[sequence].attempts++;
            send(transit[sequence].data, sequence);
        } else {
            track = { sequence, attempts: transit[sequence].attempts, status: xhr.status };
            encode(Event.Upload);
            delete transit[sequence];
        }
    }
}

function recover(): void {
    if (typeof localStorage !== "undefined") {
        let data = localStorage.getItem("clarity-backup");
        if (data && data.length > 0) {
            let handler = config.upload ? config.upload : send;
            handler(data);
        }
    }
}

function backup(payload: EncodedPayload): void {
    if (typeof localStorage !== "undefined") {
        payload.e = JSON.stringify(envelope(true, true));
        localStorage.setItem("clarity-backup", stringify(payload));
    }
}
