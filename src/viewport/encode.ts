import {Event, Token} from "@clarity-types/data";
import {Metric} from "@clarity-types/metric";
import * as metrics from "@src/metric";
import * as document from "./document";
import * as resize from "./resize";
import * as scroll from "./scroll";
import * as visibility from "./visibility";

export default function(type: Event): Token[] {
    let tokens = [];

    switch (type) {
        case Event.Resize:
            let r = resize.data;
            tokens.push(r.width);
            tokens.push(r.height);
            metrics.measure(Metric.ViewportWidth, r.width);
            metrics.measure(Metric.ViewportHeight, r.height);
            resize.reset();
            break;
        case Event.Document:
            let d = document.data;
            tokens.push(d.width);
            tokens.push(d.height);
            metrics.measure(Metric.DocumentWidth, d.width);
            metrics.measure(Metric.DocumentHeight, d.height);
            document.reset();
            break;
        case Event.Scroll:
            let s = scroll.summarize();
            let timestamp: number = null;
            for (let i = 0; i < s.length; i++) {
                let entry = s[i];
                timestamp = (i === 0) ? entry.time : timestamp;
                tokens.push(entry.time - timestamp);
                tokens.push(entry.x);
                tokens.push(entry.y);
            }
            scroll.reset();
            break;
        case Event.Visibility:
            let v = visibility.data;
            tokens.push(v.visible);
            visibility.reset();
            break;
    }

    return tokens;
}
