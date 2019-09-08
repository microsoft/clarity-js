import { Event, IPayload, Token, Upload } from "@clarity-types/data";
import { Metric } from "@clarity-types/metric";
import config from "@src/core/config";
import {envelope} from "@src/data/metadata";
import { counter } from "@src/metric";
import metrics from "@src/metric/encode";

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

    switch (type) {
        case Event.Discover:
        case Event.Mutation:
        case Event.BoxModel:
        case Event.Checksum:
        case Event.Document:
            counter(Metric.LayoutBytes, event.length);
            break;
        case Event.Network:
        case Event.Performance:
            counter(Metric.NetworkBytes, event.length);
            break;
        case Event.ScriptError:
        case Event.ImageError:
            counter(Metric.DiagnosticBytes, event.length);
            break;
        default:
            counter(Metric.InteractionBytes, event.length);
            break;
    }

    clearTimeout(timeout);
    timeout = window.setTimeout(upload, config.delay);
}

export function end(): void {
    upload(true);
    events = [];
}

function upload(last: boolean = false): void {
    let u = last && "sendBeacon" in navigator ? Upload.Beacon : Upload.Async;
    let handler = config.upload ? config.upload : send;
    let payload: IPayload = {e: JSON.stringify(envelope(u)), m: JSON.stringify(metrics(last)), d: `[${events.join()}]`};
    handler(stringify(payload), last);
    backup(payload);
    events = [];
}

function stringify(payload: IPayload): string {
    return `{"e":${payload.e},"m":${payload.m},"d":${payload.d}}`;
}

function send(data: string, last: boolean = false): void {
    if (config.url.length > 0) {
        if (last && "sendBeacon" in navigator) {
            navigator.sendBeacon(config.url, data);
        } else {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", config.url);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(data);
        }
    }
}

function recover(): void {
    if ("localStorage" in window) {
        let data = localStorage.getItem("clarity-backup");
        if (data && data.length > 0) {
            send(data);
        }
    }
}

function backup(payload: IPayload): void {
    if ("localStorage" in window) {
        payload.e = JSON.stringify(envelope(Upload.Backup));
        localStorage.setItem("clarity-backup", stringify(payload));
    }
}
