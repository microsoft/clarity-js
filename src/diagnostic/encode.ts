import {Event, Token} from "@clarity-types/data";
import time from "@src/core/time";
import { observe } from "@src/data/target";
import { queue } from "@src/data/upload";
import * as image from "@src/diagnostic/image";
import * as script from "@src/diagnostic/script";

export default function(type: Event): Token[] {
    let tokens: Token[] = [time(), type];

    switch (type) {
        case Event.ScriptError:
            tokens.push(script.data.message);
            tokens.push(script.data.line);
            tokens.push(script.data.column);
            tokens.push(script.data.stack);
            tokens.push(script.data.source);
            queue(tokens);
            break;
        case Event.ImageError:
            tokens.push(image.data.source);
            tokens.push(observe(image.data.target));
            queue(tokens);
            break;
    }

    return tokens;
}
