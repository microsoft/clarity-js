import {Event, Metric, Token} from "@clarity-types/data";
import time from "@src/core/time";
import * as metric from "@src/data/metric";
import { queue } from "@src/data/upload";
import * as change from "./change";
import * as pointer from "./pointer";
import * as resize from "./resize";
import * as scroll from "./scroll";
import * as selection from "./selection";
import * as unload from "./unload";
import * as visibility from "./visibility";

export default function(type: Event): void {
    let t = time();
    let tokens: Token[] = [t, type];
    switch (type) {
        case Event.MouseDown:
        case Event.MouseUp:
        case Event.MouseMove:
        case Event.MouseWheel:
        case Event.Click:
        case Event.DoubleClick:
        case Event.RightClick:
        case Event.TouchStart:
        case Event.TouchEnd:
        case Event.TouchMove:
        case Event.TouchCancel:
            for (let i = 0; i < pointer.data[type].length; i++) {
                let entry = pointer.data[type][i];
                tokens = [entry.time, type];
                tokens.push(entry.target);
                tokens.push(entry.x);
                tokens.push(entry.y);
                if (entry.targetX && entry.targetY) {
                    tokens.push(entry.targetX);
                    tokens.push(entry.targetY);
                }
                queue(tokens);
            }
            pointer.reset();
            break;
        case Event.Resize:
            let r = resize.data;
            tokens.push(r.width);
            tokens.push(r.height);
            queue(tokens);
            metric.measure(Metric.ViewportWidth, r.width);
            metric.measure(Metric.ViewportHeight, r.height);
            resize.reset();
            break;
        case Event.Unload:
            let u = unload.data;
            tokens.push(u.name);
            queue(tokens);
            metric.counter(Metric.EndTime, t);
            unload.reset();
            break;
        case Event.InputChange:
            let ch = change.data;
            tokens.push(ch.target);
            tokens.push(ch.value);
            queue(tokens);
            metric.counter(Metric.Changes);
            change.reset();
            break;
        case Event.Selection:
            let s = selection.data;
            tokens.push(s.start);
            tokens.push(s.startOffset);
            tokens.push(s.end);
            tokens.push(s.endOffset);
            queue(tokens);
            metric.counter(Metric.Selections);
            selection.reset();
            break;
        case Event.Scroll:
            for (let i = 0; i < scroll.data.length; i++) {
                let entry = scroll.data[i];
                tokens = [entry.time, type];
                tokens.push(entry.target);
                tokens.push(entry.x);
                tokens.push(entry.y);
                queue(tokens);
            }
            scroll.reset();
            break;
        case Event.Visible:
            let v = visibility.data;
            tokens.push(v.visible);
            queue(tokens);
            visibility.reset();
            break;
    }
}
