import {Token} from "@clarity-types/data";
import * as counter from "./counter";
import * as histogram from "./histogram";
import * as mark from "./mark";
import * as timer from "./timer";

export default function(): Token[] {
    let metrics = [];

    // Encode counters
    let counters = counter.summarize();
    for (let key in counters) {
        if (counters[key]) {
            let c = counters[key];
            metrics.push(key);
            metrics.push(c.counter);
        }
    }

    // Encode histograms
    let histograms = histogram.summarize();
    for (let key in histograms) {
        if (histograms[key]) {
            let h = histograms[key];
            metrics.push(key);
            metrics.push(h.sum);
            metrics.push(h.min);
            metrics.push(h.max);
            metrics.push(h.sumsquared);
            metrics.push(h.count);
        }
    }

    // Encode timers
    let timers = timer.summarize();
    for (let key in timers) {
        if (timers[key]) {
            let t = timers[key];
            metrics.push(key);
            metrics.push(t.duration);
            metrics.push(t.count);
        }
    }

    // Encode marks
    let marks = mark.summarize();
    for (let m of marks) {
        metrics.push(m.mark);
        metrics.push(m.start);
        metrics.push(m.end);
    }

    return metrics;
}
