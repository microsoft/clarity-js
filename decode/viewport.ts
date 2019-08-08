import { DecodedToken, Event, Token } from "../types/data";

export default function(tokens: Token[], event: Event): DecodedToken[] {
    let decoded: DecodedToken[] = [];
    switch (event) {
        case Event.Resize:
        case Event.Document:
            decoded.push({ width: tokens[0], height: tokens[1] });
            break;
        case Event.Scroll:
            let time = 0;
            for (let i = 0; i < tokens.length; i = i + 3) {
                time += tokens[i] as number;
                decoded.push({ time, x: tokens[i + 1], y: tokens[i + 2] });
            }
            break;
    }
    return decoded;
}
