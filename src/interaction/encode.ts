import {Event, Metric, Token} from "@clarity-types/data";
import * as task from "@src/core/task";
import time from "@src/core/time";
import { observe } from "@src/data/target";
import { queue } from "@src/data/upload";
import * as change from "./change";
import * as pointer from "./pointer";
import * as resize from "./resize";
import * as scroll from "./scroll";
import * as selection from "./selection";
import * as unload from "./unload";
import * as visibility from "./visibility";

export default async function(type: Event): Promise<void> {
    let t = time();
    let tokens: Token[] = [t, type];
    let timer = Metric.InteractionDuration;
    task.start(timer);
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
            for (let i = 0; i < pointer.data.length; i++) {
                if (task.blocking(timer)) { await task.idle(timer); }
                let entry = pointer.data[i];
                tokens = [entry.time, entry.event];
                tokens.push(observe(entry.data.target as Node));
                tokens.push(entry.data.x);
                tokens.push(entry.data.y);
                queue(tokens);
            }
            pointer.reset();
            break;
        case Event.Resize:
            let r = resize.data;
            tokens.push(r.width);
            tokens.push(r.height);
            queue(tokens);
            resize.reset();
            break;
        case Event.Unload:
            let u = unload.data;
            tokens.push(u.name);
            queue(tokens);
            unload.reset();
            break;
        case Event.InputChange:
            let ch = change.data;
            tokens.push(observe(ch.target));
            tokens.push(ch.value);
            queue(tokens);
            change.reset();
            break;
        case Event.Selection:
            let s = selection.data;
            tokens.push(observe(s.start));
            tokens.push(s.startOffset);
            tokens.push(observe(s.end));
            tokens.push(s.endOffset);
            queue(tokens);
            selection.reset();
            break;
        case Event.Scroll:
            for (let i = 0; i < scroll.data.length; i++) {
                if (task.blocking(timer)) { await task.idle(timer); }
                let entry = scroll.data[i];
                tokens = [entry.time, type];
                tokens.push(observe(entry.target));
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
    task.stop(timer);
}
