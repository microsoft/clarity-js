import * as counter from "../instrument/counter";
import { Method } from "../lib/enums";
import hash from "../lib/hash";
import {INodeData, INodeValue} from "../lib/nodetree";
import {nodes} from "./state";
import {check} from "./token";

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
        let layouts = [];
        let data: INodeData = value.data;
        let keys = ["tag", "layout", "attributes", "value"];
        for (let key of keys) {
            if (data[key]) {
                switch (key) {
                    case "tag":
                        markup.push(number(value.id));
                        if (value.parent) { markup.push(number(value.parent)); }
                        if (value.next) { markup.push(number(value.next)); }
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
                            let boxes = layout(data[key]);
                            for (let box of boxes) {
                                layouts.push(box);
                            }
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
        // Add layout boxes
        for (let entry of layouts) {
            markup.push(entry);
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
            return `${textCount.toString(36)}*${wordCount.toString(36)}`;
    }
}

function layout(l: number[]): string[] {
    let output = [];
    for (let i = 0; i < l.length; i = i + 4) {
        output.push([l[i + 0].toString(36), l[i + 1].toString(36), l[i + 2].toString(36), l[i + 3].toString(36)].join("*"));
    }
    return output;
}

function number(id: number): number {
    let output = id;
    if (id > 0) {
        output = id - reference;
        reference = id;
    }
    return output;
}
