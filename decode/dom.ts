import { resolve } from "../src/data/token";
import { Event, IDecodedEvent, Token } from "../types/data";
import { IDecodedNode } from "../types/dom";

export default function(tokens: Token[]): IDecodedEvent {
    let lastType = null;
    let node = [];
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    let decoded: IDecodedEvent = {time, event, data: []};
    let tagIndex = 0;
    for (let i = 2; i < tokens.length; i++) {
        let token = tokens[i];
        let type = typeof(token);
        switch (type) {
            case "number":
                if (type !== lastType && lastType !== null) {
                    decoded.data.push(process(node, tagIndex));
                    node = [];
                    tagIndex = 0;
                }
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
    decoded.data.push(process(node, tagIndex));

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
    console.log("Node: " + JSON.stringify(node) + " | Tag: " + tagIndex);
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
        } else if (output.tag === "*T") {
            value = token;
            if (parts.length === 2) {
                let textCount = parseInt(parts[0], 36);
                let wordCount = parseInt(parts[1], 36);
                if (isFinite(textCount) && isFinite(wordCount)) {
                    value = wordCount > 0 && textCount === 0 ? " " : Array(Math.floor((textCount + 1) / 2)).join("* ");
                }
            }
        }
    }

    if (layouts.length > 0) { output.layout = layouts; }
    if (hasAttribute) { output.attributes = attributes; }
    if (value) { output.value = value; }

    return output;
}
