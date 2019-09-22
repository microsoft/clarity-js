import hash from "../src/data/hash";
import { resolve } from "../src/data/token";
import { Event, IDecodedEvent, Token } from "../types/data";
import { IAttributes, IBoxModel, IChecksum, ICrawl, IDecodedNode, IDocumentSize, ILayout } from "../types/layout";

const ID_ATTRIBUTE = "data-clarity";
let placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiOAMAANUAz5n+TlUAAAAASUVORK5CYII=";
let selectors: ILayout[];
let urls: ICrawl[];
let lastTime: number;

export function reset(): void {
    selectors = [];
    urls = [];
    lastTime = null;
}

export function decode(tokens: Token[]): IDecodedEvent {
    let time = lastTime = tokens[0] as number;
    let event = tokens[1] as Event;
    let decoded: IDecodedEvent = {time, event, data: []};

    switch (event) {
        case Event.Document:
            let d: IDocumentSize = { width: tokens[2] as number, height: tokens[3] as number };
            decoded.data.push(d);
            return decoded;
        case Event.BoxModel:
            for (let i = 2; i < tokens.length; i += 2) {
                let boxmodel: IBoxModel = { id: tokens[i] as number, box: tokens[i + 1] as number[] };
                decoded.data.push(boxmodel);
            }
            return decoded;
        case Event.Checksum:
            let reference = 0;
            for (let i = 2; i < tokens.length; i += 2) {
                let id = (tokens[i] as number) + reference;
                let token = tokens[i + 1];
                let checksum: IChecksum = { id, checksum: typeof(token) === "object" ? tokens[token[0]] : token };
                decoded.data.push(checksum);
                reference = id;
            }
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

export function enrich(): IDecodedEvent[] {
    let output = [];
    if (selectors.length > 0) { output.push({ time: lastTime, event: Event.Layout, data: selectors }); }
    if (urls.length > 0) { output.push({ time: lastTime, event: Event.Crawl, data: urls }); }
    return output;
}

function process(node: any[] | number[], tagIndex: number): IDecodedNode {
    let output: IDecodedNode = {
        id: node[0],
        parent: tagIndex > 1 ? node[1] : null,
        next: tagIndex > 2 ? node[2] : null,
        tag: node[tagIndex]
    };
    let hasAttribute = false;
    let attributes = {};
    let value = null;
    let path = output.parent in selectors ? `${selectors[output.parent]}>` : null;

    for (let i = tagIndex + 1; i < node.length; i++) {
        let token = node[i] as string;
        let keyIndex = token.indexOf("=");
        let lastChar = token[token.length - 1];
        if (i === (node.length - 1) && output.tag === "STYLE") {
            value = token;
        } else if (lastChar === ">" && keyIndex === -1) {
            path = token;
        } else if (output.tag !== "*T" && keyIndex > 0) {
            hasAttribute = true;
            let k = token.substr(0, keyIndex);
            let v = unmask(token.substr(keyIndex + 1));
            switch (k) {
                case "src":
                    v = v.length === 0 ? placeholderImage : v;
                    break;
                default:
                    break;
            }
            attributes[k] = v;
        } else if (output.tag === "*T") {
            value = unmask(token);
        }
    }

    selector(output.id, output.tag, path, attributes);
    crawler(output.tag, attributes);
    if (hasAttribute) { output.attributes = attributes; }
    if (value) { output.value = value; }

    return output;
}

function selector(id: number, tag: string, path: string, attributes: IAttributes): void {
    switch (tag) {
        case "STYLE":
        case "TITLE":
        case "LINK":
        case "META":
        case "*T":
        case "*D":
            break;
        default:
            let s = path && path.length > 0 ? path + tag : tag;
            if ("id" in attributes) { s = `${tag}#${attributes["id"]}`; }
            if ("class" in attributes) { s += `.${attributes["class"].trim().split(" ").join(".")}`; }
            if (ID_ATTRIBUTE in attributes) { s = `*${attributes[ID_ATTRIBUTE]}`; }
            selectors.push({ id, checksum: hash(s), selector: s });
            break;
    }
}

function crawler(tag: string, attributes: IAttributes): void {
    switch (tag) {
        case "LINK":
            if ("href" in attributes) { urls.push({ tag, url: attributes["href"]}); }
            break;
    }
}

function unmask(value: string): string {
    let parts = value.split("*");
    let placeholder = "x";
    if (parts.length === 2) {
        let textCount = parseInt(parts[0], 36);
        let wordCount = parseInt(parts[1], 36);
        if (isFinite(textCount) && isFinite(wordCount)) {
            if (wordCount > 0 && textCount === 0) {
                value = " ";
            } else if (wordCount === 0 && textCount > 0) {
                value = Array(textCount + 1).join(placeholder);
            } else if (wordCount > 0 && textCount > 0) {
                value = "";
                let avg = Math.floor(textCount / wordCount);
                while (value.length < textCount + wordCount) {
                    let gap = Math.min(avg, textCount + wordCount - value.length);
                    value += Array(gap + 1).join(placeholder) + " ";
                }
            } else {
                value = Array(textCount + wordCount + 1).join(placeholder);
            }
        }
    }
    return value;
}
