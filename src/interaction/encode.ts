import {Event, Metric, TargetInfo, Token} from "@clarity-types/data";
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
            for (let i = 0; i < pointer.state.length; i++) {
                if (task.shouldYield(timer)) { await task.suspend(timer); }
                let entry = pointer.state[i];
                tokens = [entry.time, entry.event];
                tokens.push(observe(entry.data.target as TargetInfo));
                tokens.push(entry.data.x);
                tokens.push(entry.data.y);
                queue(tokens, type);
            }
            pointer.reset();
            break;
        case Event.Resize:
            let r = resize.data;
            tokens.push(r.width);
            tokens.push(r.height);
            resize.reset();
            queue(tokens, type);
            break;
        case Event.Unload:
            let u = unload.data;
            tokens.push(u.name);
            unload.reset();
            queue(tokens, type);
            break;
        case Event.InputChange:
            let ch = change.data;
            if (ch) {
                tokens.push(observe(ch.target as TargetInfo));
                tokens.push(ch.value);
                change.reset();
                queue(tokens, type);
            }
            break;
        case Event.Selection:
            let s = selection.data;
            if (s) {
                tokens.push(observe(s.start as TargetInfo));
                tokens.push(s.startOffset);
                tokens.push(observe(s.end as TargetInfo));
                tokens.push(s.endOffset);
                selection.reset();
                queue(tokens, type);
            }
            break;
        case Event.Scroll:
            for (let i = 0; i < scroll.state.length; i++) {
                if (task.shouldYield(timer)) { await task.suspend(timer); }
                let entry = scroll.state[i];
                tokens = [entry.time, type];
                tokens.push(observe(entry.data.target as TargetInfo));
                tokens.push(entry.data.x);
                tokens.push(entry.data.y);
                queue(tokens, type);
            }
            scroll.reset();
            break;
        case Event.Visibility:
            let v = visibility.data;
            tokens.push(v.visible);
            visibility.reset();
            queue(tokens, type);
            break;
    }
    task.stop(timer);
}
