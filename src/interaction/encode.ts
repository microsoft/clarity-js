import {Event, Token} from "@clarity-types/data";
import { Mouse } from "@clarity-types/interaction";
import * as mouse from "./mouse";

export default function(type: Event): Token[] {
    let tokens: Token[] = [];

    switch (type) {
        case Event.Mouse:
            let m = mouse.summarize();
            let timestamp: number = null;
            let mouseType: Mouse = null;
            for (let i = 0; i < m.length; i++) {
                let entry = m[i];

                if (i === 0) {
                    timestamp = entry.time;
                    tokens.push(timestamp);
                    tokens.push(type);
                }

                if (mouseType !== entry.type) { tokens.push(entry.type); }
                tokens.push(entry.time - timestamp);
                tokens.push(entry.x);
                tokens.push(entry.y);
                tokens.push(entry.target);
                tokens.push(entry.buttons);

                timestamp = entry.time;
                mouseType = entry.type;
            }
            mouse.reset();
            break;
    }

    return tokens;
}
