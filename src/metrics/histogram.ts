import { Histogram, IHistogram, IHistogramSummary} from "@clarity-types/metrics";

let tracker: IHistogram = {};
let summary: IHistogramSummary = {};

export function observe(key: Histogram, value: number): void {
    if (!(key in tracker)) {
        tracker[key] = { updated: true, values: [] };
    }
    tracker[key].updated = true;
    tracker[key].values.push(value);
}

export function summarize(): IHistogramSummary {
    for (let key in tracker) {
        if (tracker[key]) {
            summary[key] = { sum: 0, min: -1, max: -1, sumsquared: 0, count: 0 };
            for (let value of tracker[key].values) {
                summary[key].sum += value;
                summary[key].min = summary[key].count > 0 ? Math.min(summary[key].min, value) : value;
                summary[key].max = summary[key].count > 0 ? Math.max(summary[key].max, value) : value;
                summary[key].sumsquared += value;
                summary[key].count++;
            }
            tracker[key].updated = false;
        }
    }
    return summary;
}
