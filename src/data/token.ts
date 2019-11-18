import {Token} from "@clarity-types/data";

export default function(tokens: Token[], metadata: Token[]): Token[] {
    let reference = null;
    for (let token of metadata) {
        let index = tokens.indexOf(token);
        if (index >= 0) {
            if (reference) { reference.push(index); } else {
                reference = [index];
                tokens.push(reference);
            }
        } else {
            reference = null;
            tokens.push(token);
        }
    }
    return tokens;
}
