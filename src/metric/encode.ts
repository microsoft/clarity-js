import {Token} from "@clarity-types/data";
import { metrics, reset, updates } from "@src/metric";

export default function(last: boolean = false): Token[] {
    let output = [];

    // Encode metrics
    for (let metric in metrics) {
        if (metrics[metric]) {
            let m = num(metric);
            if (updates.indexOf(m) >= 0 || last) {
                output.push(m);
                output.push(metrics[metric]);
            }
        }
    }

    reset();

    return output;
}

function num(input: string): number {
    return parseInt(input, 10);
}
