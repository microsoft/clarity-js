import {Event, Token} from "@clarity-types/data";
import {Metric} from "@clarity-types/metric";
import time from "@src/core/time";
import queue from "@src/data/queue";
import * as image from "@src/diagnostic/image";
import * as script from "@src/diagnostic/script";
import * as metric from "@src/metric";

export default function(type: Event): Token[] {
    let tokens: Token[] = [time(), type];

    switch (type) {
        case Event.ScriptError:
            let scripts = script.data;
            for (let e of scripts) {
                tokens.push(e.source);
                tokens.push(e.message);
                tokens.push(e.line);
                tokens.push(e.column);
                tokens.push(e.stack);
                queue(tokens);
                metric.counter(Metric.ScriptErrors);
            }
            script.reset();
            break;
        case Event.ImageError:
            let images = image.data;
            for (let e of images) {
                tokens.push(e.source);
                tokens.push(e.target);
                queue(tokens);
                metric.counter(Metric.ImageErrors);
            }
            image.reset();
            break;
    }

    return tokens;
}
