import { BooleanFlag, Envelope, Event, MetricData, PageData, PingData } from "../types/data";
import { SummaryData, TagData, TargetData, Token, UpgradeData, Upload, UploadData } from "../types/data";
import { DataEvent } from "../types/decode/data";

let summaries: { [key: number]: SummaryData[] } = null;
const SUMMARY_THRESHOLD = 30;

export function reset(): void {
    summaries = {};
}

export function decode(tokens: Token[]): DataEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    switch (event) {
        case Event.Page:
            let page: PageData = {
                timestamp: tokens[2] as number,
                ua: tokens[3] as string,
                url: tokens[4] as string,
                referrer: tokens[5] as string,
                lean: tokens[6] as BooleanFlag,
            };
            return { time, event, data: page };
        case Event.Ping:
            let ping: PingData = { gap: tokens[2] as number };
            return { time, event, data: ping };
        case Event.Tag:
            let tag: TagData = { key: tokens[2] as string, value: tokens[3] as string[] };
            return { time, event, data: tag };
        case Event.Target:
            let targetData: TargetData[] = [];
            for (let t = 2; t < tokens.length; t += 3) {
                let target: TargetData = { id: tokens[t] as number, hash: tokens[t + 1] as string, box: tokens[t + 2] as number[] };
                targetData.push(target);
            }
            return { time, event, data: targetData };
        case Event.Upgrade:
            let upgrade: UpgradeData = { key: tokens[2] as string };
            return { time, event, data: upgrade };
        case Event.Upload:
            let upload: UploadData = { sequence: tokens[2] as number, attempts: tokens[3] as number, status: tokens[4] as number };
            return { time, event, data: upload };
        case Event.Metric:
            let i = 2; // Start from 3rd index since first two are used for time & event
            let metrics: MetricData = {};
            while (i < tokens.length) {
                metrics[tokens[i++] as number] = tokens[i++] as number;
            }
            return { time, event, data: metrics };
    }
}

export function envelope(tokens: Token[]): Envelope {
    return {
        sequence: tokens[0] as number,
        version: tokens[1] as string,
        projectId: tokens[2] as string,
        userId: tokens[3] as string,
        sessionId: tokens[4] as string,
        pageId: tokens[5] as string,
        upload: tokens[6] as Upload,
        end: tokens[7] as BooleanFlag
    };
}

export function summarize(entry: Token[]): void {
    let time = entry[0] as number;
    let type = entry[1] as Event;
    let data: SummaryData = { event: type, start: time, end: time };
    if (!(type in summaries)) { summaries[type] = [data]; }

    let s = summaries[type][summaries[type].length - 1];
    if (time - s.end < SUMMARY_THRESHOLD) { s.end = time; } else { summaries[type].push(data); }
}

export function summary(): DataEvent[] {
    let data: SummaryData[] = [];
    let time = null;
    for (let type in summaries) {
        if (summaries[type]) {
            for (let d of summaries[type]) {
                time = time ? Math.min(time, d.start) : d.start;
                data.push(d);
            }
        }
    }
    return data.length > 0 ? [{ time, event: Event.Summary, data }] : null;
}
