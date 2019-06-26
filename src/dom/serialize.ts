import {nodes} from "../data/state";
import {check} from "../data/token";
import * as counter from "../instrument/counter";
import hash from "../lib/hash";
import { Method } from "../lib/method";
import {INodeData, INodeValue} from "../lib/nodetree";

window["HASH"] = hash;
let reference: number = 0;

export default async function(): Promise<string> {
    let method = Method.Serialize;
    counter.start(method);
    let markup = [];
    let values: INodeValue[] = nodes.getValues();
    reference = 0;
    for (let value of values) {
        if (counter.longtasks(method)) { await counter.idle(method); }
        let metadata = [];
        let data: INodeData = value.data;
        let keys = ["tag", "attributes", "layout", "value"];
        for (let key of keys) {
            if (data[key]) {
                switch (key) {
                    case "tag":
                        markup.push(number(value.parent));
                        markup.push(number(value.previous));
                        markup.push(number(value.id));
                        metadata.push(data[key]);
                        break;
                    case "attributes":
                        for (let attr in data[key]) {
                            if (data[key][attr]) {
                                metadata.push(`${attr}=${data[key][attr]}`);
                            }
                        }
                        break;
                    case "layout":
                        if (data[key].length > 0) {
                            markup.push(layout(data[key]));
                        }
                        break;
                    case "value":
                        let parent = nodes.node(value.parent);
                        let parentTag = nodes.get(parent).data.tag;
                        metadata.push(text(parentTag, data[key]));
                        break;
                }
            }
        }

        // Add metadata
        metadata = meta(metadata);
        for (let token of metadata) {
            let index: number = typeof token === "string" ? markup.indexOf(token) : -1;
            markup.push(index >= 0 && token.length > index.toString().length ? [index] : token);
        }

        // Mark this node as processed, so we don't serialize it again
        value["update"] = false;
    }
    let json = JSON.stringify(markup);
    counter.stop(method);
    return json;
}

function meta(metadata: string[]): string[] | string[][] {
    let value = JSON.stringify(metadata);
    let hashed = hash(value);
    return check(hashed, metadata) && hashed.length < value.length ? [[hashed]] : metadata;
}

function text(tag: string, value: string): string {
    switch (tag) {
        case "STYLE":
        case "TITLE":
            return value;
        default:
            return value;
            let wasWhiteSpace = false;
            let textCount = 0;
            let wordCount = 0;
            for (let i = 0; i < value.length; i++) {
                let code = value.charCodeAt(i);
                let isWhiteSpace = (code === 32 || code === 10 || code === 9 || code === 13);
                textCount += isWhiteSpace ? 0 : 1;
                wordCount += isWhiteSpace && !wasWhiteSpace ? 1 : 0;
                wasWhiteSpace = isWhiteSpace;
            }
            return `${textCount}x${wordCount}`;
    }
}

function layout(l: number[]): string {
    let output = [];
    for (let i = 0; i < l.length; i = i + 4) {
        output.push([l[i + 0].toString(36), l[i + 1].toString(36), l[i + 2].toString(36), l[i + 3].toString(36)].join("."));
    }
    return output.join("|");
}

function number(id: number): number {
    let output = id;
    if (id > 0) {
        output = id - reference;
        reference = id;
    }
    return output;
}
