import { Event, IDecodedEvent, IEventSummary, Token } from "../types/data";

let summary: { [key: number]: IEventSummary[] } = null;
const SUMMARY_THRESHOLD = 250;

export function reset(): void {
    summary = {};
}

export function decode(entry: Token[]): void {
    let time = entry[0] as number;
    let type = entry[1] as Event;
    let data: IEventSummary = { event: type, start: time, end: time };
    if (!(type in summary)) { summary[type] = [data]; }

    let s = summary[type][summary[type].length - 1];
    if (time - s.end < SUMMARY_THRESHOLD) { s.end = time; } else { summary[type].push(data); }
}

export function enrich(): IDecodedEvent[] {
    let data: IEventSummary[] = [];
    let time = null;
    for (let type in summary) {
        if (summary[type]) {
            for (let d of summary[type]) {
                time = time ? Math.min(time, d.start) : d.start;
                data.push(d);
            }
        }
    }
    return data.length > 0 ? [{ time, event: Event.Summary, data }] : [];
}
