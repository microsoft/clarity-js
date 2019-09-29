import { Event, IEnvelope, IMetricData, IPageData, IPingData, ISummaryData, ITagData, State, Token, Upload } from "../types/data";
import { IDataEvent, ISummaryEvent } from "../types/decode";

let summaries: { [key: number]: ISummaryData[] } = null;
const SUMMARY_THRESHOLD = 250;

export function reset(): void {
    summaries = {};
}

export function decode(tokens: Token[]): IDataEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    switch (event) {
        case Event.Page:
            let page: IPageData = {
                timestamp: tokens[2] as number,
                elapsed: tokens[3] as number,
                url: tokens[4] as string,
                referrer: tokens[5] as string,
                lean: tokens[6] as number,
            };
            return { time, event, data: page };
        case Event.Ping:
            let ping: IPingData = { gap: tokens[2] as number };
            return { time, event, data: ping };
        case Event.Tag:
            let tag: ITagData = { key: tokens[2] as string, value: tokens[3] as string };
            return { time, event, data: tag };
        case Event.Metric:
            let i = 0;
            let metrics: IMetricData = {};
            while (i < tokens.length) {
                metrics[tokens[i++] as number] = tokens[i++] as number;
            }
            return { time, event, data: metrics };
    }
}

export function envelope(tokens: Token[]): IEnvelope {
    return {
        elapsed: tokens[0] as number,
        sequence: tokens[1] as number,
        version: tokens[2] as string,
        projectId: tokens[3] as string,
        userId: tokens[4] as string,
        sessionId: tokens[5] as string,
        pageId: tokens[6] as string,
        upload: tokens[7] as Upload,
        end: tokens[8] as State
    };
}

export function summarize(entry: Token[]): void {
    let time = entry[0] as number;
    let type = entry[1] as Event;
    let data: ISummaryData = { event: type, start: time, end: time };
    if (!(type in summaries)) { summaries[type] = [data]; }

    let s = summaries[type][summaries[type].length - 1];
    if (time - s.end < SUMMARY_THRESHOLD) { s.end = time; } else { summaries[type].push(data); }
}

export function summary(): ISummaryEvent[] {
    let data: ISummaryData[] = [];
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
