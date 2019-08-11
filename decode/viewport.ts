import { DecodedToken, Event, Token } from "../types/data";
import { IDocumentSize, IResizeViewport, IScrollViewport } from "../types/viewport";

export default function(tokens: Token[], event: Event): DecodedToken[] {
    let decoded: DecodedToken[] = [];
    switch (event) {
        case Event.Resize:
            let r: IResizeViewport = { width: tokens[0] as number, height: tokens[1] as number };
            decoded.push(r);
        case Event.Document:
            let d: IDocumentSize = { width: tokens[0] as number, height: tokens[1] as number };
            decoded.push(d);
            break;
        case Event.Scroll:
            let time = 0;
            for (let i = 0; i < tokens.length; i = i + 3) {
                time += tokens[i] as number;
                let s: IScrollViewport = { time, x: tokens[i + 1] as number, y: tokens[i + 2] as number };
                decoded.push(s);
            }
            break;
    }
    return decoded;
}
