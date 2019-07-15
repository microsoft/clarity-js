import {IMark, IMarkSummary, Mark } from "@clarity-types/metrics";

let tracker: IMark[] = [];
let summary: IMarkSummary[] = [];

export function mark(key: Mark, tag: string, start: number, end: number = 0): void {
    end = end > 0 ? end : start;
    tracker.push( { updated: true, mark: tag, start, end});
}

export function summarize(): IMarkSummary[] {
    for (let entry of tracker) {
        if (entry.updated) {
            summary.push({mark: entry.mark, start: entry.start, end: entry.end });
            entry.updated = false;
        }
    }
    return summary;
}
