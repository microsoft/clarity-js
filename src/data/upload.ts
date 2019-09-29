import { EncodedPayload, Event, Metric, Token } from "@clarity-types/data";
import config from "@src/core/config";
import {envelope} from "@src/data/metadata";
import * as metric from "@src/data/metric";
import * as ping from "@src/data/ping";

let events: string[];
let timeout: number = null;

export function start(): void {
    events = [];
    recover();
}

export function queue(data: Token[]): void {
    let type = data.length > 1 ? data[1] : null;
    let event = JSON.stringify(data);
    events.push(event);

    // For Event.Metric, do not schedule upload callback
    if (type === Event.Metric) { return; }

    switch (type) {
        case Event.Discover:
        case Event.Mutation:
        case Event.BoxModel:
        case Event.Checksum:
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
}

function upload(last: boolean = false): void {
    metric.compute();
    let handler = config.upload ? config.upload : send;
    let payload: EncodedPayload = {e: JSON.stringify(envelope(last)), d: `[${events.join()}]`};
    handler(stringify(payload), last);
    if (last) { backup(payload); } else { ping.reset(); }
    events = [];
}

function stringify(payload: EncodedPayload): string {
    return `{"e":${payload.e},"d":${payload.d}}`;
}

function send(data: string, last: boolean = false): void {
    if (config.url.length > 0) {
        if (last && "sendBeacon" in navigator) {
            navigator.sendBeacon(config.url, data);
        } else {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", config.url);
            xhr.send(data);
        }
    }
}

function recover(): void {
    if (typeof localStorage !== "undefined") {
        let data = localStorage.getItem("clarity-backup");
        if (data && data.length > 0) {
            send(data);
        }
    }
}

function backup(payload: EncodedPayload): void {
    if (typeof localStorage !== "undefined") {
        payload.e = JSON.stringify(envelope(true, true));
        localStorage.setItem("clarity-backup", stringify(payload));
    }
}
