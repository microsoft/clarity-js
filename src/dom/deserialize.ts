import { resolve } from "@src/data/token";

export default function(payload: string): string {
    let json = JSON.parse(payload);
    let tokens = [];
    let number = 0;
    for (let token of json) {
        let type = typeof(token);
        switch (type) {
            case "number":
                number += token;
                token = token === 0 ? token : number;
                tokens.push(token);
                break;
            case "string":
                tokens.push(token);
                break;
            case "object":
                let subtoken = token[0];
                let subtype = typeof(subtoken);
                switch (subtype) {
                    case "string":
                        let keys = resolve(token);
                        for (let key of keys) {
                            tokens.push(key);
                        }
                        break;
                    case "number":
                        token = tokens.length > subtoken ? tokens[subtoken] : null;
                        tokens.push(token);
                        break;
                }
        }
    }

    return JSON.stringify(tokens);
}
