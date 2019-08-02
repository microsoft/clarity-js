import {Token} from "@clarity-types/data";
import * as counter from "./counter";
import * as histogram from "./histogram";
import * as mark from "./mark";
import * as timer from "./timer";

export default function(): Token[] {
    let metrics = [];

    // Serialize counters
    let counters = counter.summarize();
    for (let key in counters) {
        if (counters[key]) {
            let c = counters[key];
            metrics.push([key, num(c.counter)].join("*"));
        }
    }

    // Serialize histograms
    let histograms = histogram.summarize();
    for (let key in histograms) {
        if (histograms[key]) {
            let h = histograms[key];
            metrics.push([key, num(h.sum), num(h.min), num(h.max), num(h.sumsquared), num(h.count)].join("*"));
        }
    }

    // Serialize timers
    let timers = timer.summarize();
    for (let key in timers) {
        if (timers[key]) {
            let t = timers[key];
            metrics.push([key, num(t.duration), num(t.count)].join("*"));
        }
    }

    // Serialize marks
    let marks = mark.summarize();
    for (let m of marks) {
        metrics.push([m.mark, num(m.start), num(m.end)].join("*"));
    }

    return metrics;
}

function num(x: number): string {
    return x.toString(36);
}
