import {Event, Token} from "@clarity-types/data";
import {Metric} from "@clarity-types/metric";
import * as image from "@src/diagnostic/image";
import * as script from "@src/diagnostic/script";
import * as metric from "@src/metric";

export default function(type: Event): Token[] {
    let tokens = [];

    switch (type) {
        case Event.ScriptError:
            let scripts = script.data;
            for (let e of scripts) {
                tokens.push(e.source);
                tokens.push(e.message);
                tokens.push(e.line);
                tokens.push(e.column);
                tokens.push(e.stack);
                metric.counter(Metric.ScriptErrorCount);
            }
            script.reset();
            break;
        case Event.ImageError:
            let images = image.data;
            for (let e of images) {
                tokens.push(e.source);
                tokens.push(e.target);
                metric.counter(Metric.ImageErrorCount);
            }
            image.reset();
            break;
    }

    return tokens;
}
