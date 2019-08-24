import { resolve } from "../src/data/token";
import { Event, IDecodedEvent, Token } from "../types/data";
import { IDecodedNode, IDocumentSize } from "../types/layout";

export default function(tokens: Token[]): IDecodedEvent {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    let decoded: IDecodedEvent = {time, event, data: []};
    switch (event) {
        case Event.Document:
            let d: IDocumentSize = { width: tokens[2] as number, height: tokens[3] as number };
            decoded.data.push(d);
            return decoded;
        case Event.Discover:
        case Event.Mutation:
            let lastType = null;
            let node = [];
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
        } else if (output.tag === "*T") {
            value = token;
            if (parts.length === 2) {
                let textCount = parseInt(parts[0], 36);
                let wordCount = parseInt(parts[1], 36);
                if (isFinite(textCount) && isFinite(wordCount)) {
                    if (wordCount > 0 && textCount === 0) {
                        value = " ";
                    } else if (wordCount === 0 && textCount > 0) {
                        value = Array(textCount).join("*");
                    } else if (wordCount > 0 && textCount > 0) {
                        value = "";
                        let avg = Math.floor(textCount / wordCount);
                        while (value.length < textCount + wordCount) {
                            let gap = Math.min(avg, textCount + wordCount - value.length);
                            value += Array(gap).join("x") + " ";
                        }
                    } else {
                        value = Array(Math.floor((textCount + 1) / 2)).join("x ");
                    }
                }
            }
        }
    }

    if (layouts.length > 0) { output.layout = layouts; }
    if (hasAttribute) { output.attributes = attributes; }
    if (value) { output.value = value; }

    return output;
}
