import {Event, Token} from "@clarity-types/data";
import * as document from "./document";
import * as resize from "./resize";
import * as scroll from "./scroll";

export default function(type: Event): Token[] {
    let tokens = [];

    switch (type) {
        case Event.Resize:
            let r = resize.summarize();
            tokens.push(r.width);
            tokens.push(r.height);
            break;
        case Event.Document:
            let d = document.summarize();
            tokens.push(d.width);
            tokens.push(d.height);
        case Event.Scroll:
            let s = scroll.summarize();
            let timestamp: number = null;
            for (let i = 0; i < s.length; i++) {
                let entry = s[i];
                timestamp = (i === 0) ? entry.time : timestamp;
                tokens.push(entry.time - timestamp);
                tokens.push(entry.x);
                tokens.push(entry.y);
            }
            break;
    }

    return tokens;
}
