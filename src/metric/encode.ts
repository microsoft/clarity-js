import {Token} from "@clarity-types/data";
import { MetricType } from "@clarity-types/metric";
import { metrics, reset, updates } from "@src/metric";

export default function(): Token[] {
    let output = [];

    // Encode counter metrics
    output.push(MetricType.Counter);
    let counters = metrics.counters;
    for (let metric in counters) {
        if (counters[metric]) {
            let m = num(metric);
            if (updates.indexOf(m) >= 0) {
                output.push(m);
                output.push(counters[metric]);
            }
        }
    }

    // Encode summary metrics
    output.push(MetricType.Summary);
    let summaries = metrics.measures;
    for (let metric in summaries) {
        if (summaries[metric]) {
            let m = num(metric);
            if (updates.indexOf(m) >= 0) {
                let h = summaries[metric];
                output.push(m);
                output.push(h.sum);
                output.push(h.min);
                output.push(h.max);
                output.push(h.sumsquared);
                output.push(h.count);
            }
        }
    }

    // Encode semantic events
    if (metrics.events.length > 0) { output.push(MetricType.Events); }
    let events = metrics.events;
    for (let event of events) {
        output.push(event.metric);
        output.push(event.time);
        output.push(event.duration);
    }

    // Encode user specified marks
    if (metrics.marks.length > 0) { output.push(MetricType.Marks); }
    let marks = metrics.marks;
    for (let mark of marks) {
        output.push(mark.name);
        output.push(mark.time);
    }

    reset();

    return output;
}

function num(input: string): number {
    return parseInt(input, 10);
}
