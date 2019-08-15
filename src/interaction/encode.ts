import {Event, Token} from "@clarity-types/data";
import * as mouse from "./mouse";

export default function(type: Event): Token[] {
    let tokens = [];

    switch (type) {
        case Event.Mouse:
            let m = mouse.summarize();
            let timestamp: number = null;
            for (let i = 0; i < m.length; i++) {
                let entry = m[i];
                timestamp = (i === 0) ? entry.time : timestamp;
                tokens.push(entry.time - timestamp);
                tokens.push(entry.type);
                tokens.push(entry.x);
                tokens.push(entry.y);
                tokens.push(entry.target);
                if (entry.buttons > 0) { tokens.push(entry.buttons); }
            }
            mouse.reset();
            break;
    }

    return tokens;
}
