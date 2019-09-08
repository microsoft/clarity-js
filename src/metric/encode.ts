import {Token} from "@clarity-types/data";
import { MetricType } from "@clarity-types/metric";
import { metrics, reset, updates } from "@src/metric";

export default function(last: boolean = false): Token[] {
    let output = [];

    // Encode counter metrics
    output.push(MetricType.Counter);
    let counters = metrics.counters;
    for (let metric in counters) {
        if (counters[metric]) {
            let m = num(metric);
            if (updates.indexOf(m) >= 0 || last) {
                output.push(m);
                output.push(counters[metric]);
            }
        }
    }

    // Encode summary metrics
    output.push(MetricType.Measure);
    let measures = metrics.measures;
    for (let metric in measures) {
        if (measures[metric]) {
            let m = num(metric);
            if (updates.indexOf(m) >= 0 || last) {
                output.push(m);
                output.push(measures[metric]);
            }
        }
    }

    // Encode events summary
    if (metrics.events.length > 0) { output.push(MetricType.Event); }
    let events = metrics.events;
    for (let event of events) {
        output.push(event.event);
        output.push(event.time);
        output.push(event.duration);
    }

    // Encode user specified marks
    if (metrics.marks.length > 0) { output.push(MetricType.Marks); }
    let marks = metrics.marks;
    for (let mark of marks) {
        output.push(mark.key);
        output.push(mark.value);
        output.push(mark.time);
    }

    reset();

    return output;
}

function num(input: string): number {
    return parseInt(input, 10);
}
