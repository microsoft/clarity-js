import {Event, Token} from "@clarity-types/data";
import {Metric} from "@clarity-types/metric";
import time from "@src/core/time";
import { queue } from "@src/data/upload";
import * as metric from "@src/metric";
import * as change from "./change";
import * as mouse from "./mouse";
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
            let m = mouse.data[type];
            for (let i = 0; i < m.length; i++) {
                let entry = m[i];
                tokens = [entry.time, type];
                tokens.push(entry.target);
                tokens.push(entry.x);
                tokens.push(entry.y);
                queue(tokens);
            }
            mouse.reset();
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
            metric.counter(Metric.UnloadTime, t);
            unload.reset();
            break;
        case Event.Change:
            let ch = change.data;
            tokens.push(ch.target);
            tokens.push(ch.value);
            queue(tokens);
            metric.counter(Metric.Changes);
            change.reset();
            break;
        case Event.Selection:
            let sl = selection.data;
            tokens.push(sl.start);
            tokens.push(sl.startOffset);
            tokens.push(sl.end);
            tokens.push(sl.endOffset);
            queue(tokens);
            metric.counter(Metric.Selections);
            selection.reset();
            break;
        case Event.Scroll:
            let s = scroll.data;
            for (let i = 0; i < s.length; i++) {
                let entry = s[i];
                tokens = [entry.time, type];
                tokens.push(entry.target);
                tokens.push(entry.x);
                tokens.push(entry.y);
                queue(tokens);
            }
            scroll.reset();
            break;
        case Event.Visibility:
            let v = visibility.data;
            tokens.push(v.visible);
            queue(tokens);
            visibility.reset();
            break;
    }
}
