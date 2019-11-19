import {Event, Token} from "@clarity-types/data";
import time from "@src/core/time";
import { observe } from "@src/data/target";
import { queue } from "@src/data/upload";
import * as image from "@src/diagnostic/image";
import * as script from "@src/diagnostic/script";

export default async function(type: Event): Promise<void> {
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
            if (image.data) {
                tokens.push(image.data.source);
                tokens.push(observe(image.data.target as Node));
                queue(tokens);
            }
            break;
    }
}
