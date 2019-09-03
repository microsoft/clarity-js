import {Event, Token} from "@clarity-types/data";
import {Mouse, Scroll} from "@clarity-types/interaction";
import {Metric} from "@clarity-types/metric";
import time from "@src/core/time";
import * as metric from "@src/metric";
import * as mouse from "./mouse";
import * as resize from "./resize";
import * as scroll from "./scroll";
import * as selection from "./selection";
import * as visibility from "./visibility";

export default function(type: Event): Token[] {
    let tokens: Token[] = [time(), type];
    let timestamp: number = null;
    switch (type) {
        case Event.Mouse:
            let m = mouse.summarize();
            timestamp = null;
            let mouseType: Mouse = null;
            let mouseTarget: number = null;
            for (let i = 0; i < m.length; i++) {
                let entry = m[i];

                if (i === 0) {
                    timestamp = entry.time;
                    tokens[0] = timestamp;
                }

                if (mouseType !== entry.type || mouseTarget !== entry.target) {
                    tokens.push(entry.type);
                    tokens.push(entry.target);
                    mouseType = entry.type;
                    mouseTarget = entry.target;
                }

                tokens.push(entry.time - timestamp);
                tokens.push(entry.x);
                tokens.push(entry.y);
                tokens.push(entry.buttons);

                timestamp = entry.time;
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
        case Event.Selection:
            let sl = selection.data;
            tokens.push(sl.start);
            tokens.push(sl.startOffset);
            tokens.push(sl.end);
            tokens.push(sl.endOffset);
            metric.counter(Metric.Selections);
            selection.reset();
            break;
        case Event.Scroll:
            let s = scroll.summarize();
            let scrollType: Scroll = null;
            let scrollTarget: number = null;
            timestamp = null;
            for (let i = 0; i < s.length; i++) {
                let entry = s[i];

                if (i === 0) {
                    timestamp = entry.time;
                    tokens[0] = timestamp;
                }

                if (scrollType !== entry.type || scrollTarget !== entry.target) {
                    tokens.push(entry.type);
                    tokens.push(entry.target);
                    scrollType = entry.type;
                    scrollTarget = entry.target;
                }

                tokens.push(entry.time - timestamp);
                tokens.push(entry.value);

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
