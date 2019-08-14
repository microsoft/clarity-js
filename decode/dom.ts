import { resolve } from "../src/data/token";
import { Event, Token } from "../types/data";
import { IDecodedNode } from "../types/dom";

export default function(tokens: Token[], event: Event): IDecodedNode[] {
    let number = 0;
    let lastType = null;
    let node = [];
    let decoded: IDecodedNode[] = [];
    let tagIndex = 0;
    for (let token of tokens) {
        let type = typeof(token);
        switch (type) {
            case "number":
                if (type !== lastType && lastType !== null) {
                    decoded.push(process(node, tagIndex));
                    node = [];
                    tagIndex = 0;
                }
                number += token as number;
                token = number;
                node.push(token);
                tagIndex++;
                break;
            case "string":
                node.push(token);
                break;
            case "object":
                let subtoken = token[0];
                let subtype = typeof(subtoken);
                switch (subtype) {
                    case "string":
                        let keys = resolve(token as string);
                        for (let key of keys) {
                            node.push(key);
                        }
                        break;
                    case "number":
                        token = tokens.length > subtoken ? tokens[subtoken] : null;
                        node.push(token);
                        break;
                }
        }
        lastType = type;
    }

    // Process last node
    decoded.push(process(node, tagIndex));

    return decoded;
}

function process(node: any[] | number[], tagIndex: number): IDecodedNode {
    let output: IDecodedNode = {
        id: node[0],
        parent: tagIndex > 1 ? node[1] : null,
        next: tagIndex > 2 ? node[2] : null,
        tag: node[tagIndex]
    };
    let hasAttribute = false;
    let layouts = [];
    let attributes = {};
    let value = null;

    for (let i = tagIndex + 1; i < node.length; i++) {
        let token = node[i] as string;
        let keyIndex = token.indexOf("=");
        let parts = token.split("*");
        if (i === (node.length - 1) && output.tag === "STYLE") {
            value = token;
        } else if (output.tag !== "*T" && keyIndex > 0) {
            hasAttribute = true;
            attributes[token.substr(0, keyIndex)] = token.substr(keyIndex + 1);
        } else if (parts.length === 4) {
            let layout = [];
            for (let part of parts) {
                layout.push(parseInt(part, 36));
            }
            layouts.push(layout);
        } else if (output.tag === "*T" && parts.length === 2 && parts[0].length > 0) {
            let textCount = parseInt(parts[0], 36);
            let wordCount = parseInt(parts[1], 36);
            value = wordCount > 0 && textCount === 0 ? " " : Array((textCount + 1) / 2).join("* ");
        } else if (output.tag === "*T") {
            value = token;
        }
    }

    if (layouts.length > 0) { output.layout = layouts; }
    if (hasAttribute) { output.attributes = attributes; }
    if (value) { output.value = value; }

    return output;
}
