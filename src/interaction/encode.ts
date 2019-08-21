import {Event, Token} from "@clarity-types/data";
import { Mouse } from "@clarity-types/interaction";
import {Metric} from "@clarity-types/metric";
import time from "@src/core/time";
import * as metric from "@src/metric";
import * as mouse from "./mouse";
import * as resize from "./resize";
import * as scroll from "./scroll";
import * as visibility from "./visibility";

export default function(type: Event): Token[] {
    let tokens: Token[] = [time(), type];
    let timestamp: number = null;
    switch (type) {
        case Event.Mouse:
            let m = mouse.summarize();
            timestamp = null;
            let mouseType: Mouse = null;
            for (let i = 0; i < m.length; i++) {
                let entry = m[i];

                if (i === 0) {
                    timestamp = entry.time;
                    tokens[0] = timestamp;
                }

                if (mouseType !== entry.type) { tokens.push(entry.type); }
                tokens.push(entry.time - timestamp);
                tokens.push(entry.x);
                tokens.push(entry.y);
                tokens.push(entry.target);
                tokens.push(entry.buttons);

                timestamp = entry.time;
                mouseType = entry.type;
            }
            mouse.reset();
            break;
        case Event.Resize:
            let r = resize.data;
            tokens.push(r.width);
            tokens.push(r.height);
            metric.measure(Metric.ViewportWidth, r.width);
            metric.measure(Metric.ViewportHeight, r.height);
            resize.reset();
            break;
        case Event.Scroll:
            let s = scroll.summarize();
            timestamp = null;
            for (let i = 0; i < s.length; i++) {
                let entry = s[i];

                if (i === 0) {
                    timestamp = entry.time;
                    tokens[0] = timestamp;
                }

                tokens.push(entry.time - timestamp);
                tokens.push(entry.x);
                tokens.push(entry.y);
                timestamp = entry.time;
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
