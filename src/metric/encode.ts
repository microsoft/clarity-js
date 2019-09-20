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

    // Encode user specified tags
    if (metrics.tags.length > 0) { output.push(MetricType.Tag); }
    let marks = metrics.tags;
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
