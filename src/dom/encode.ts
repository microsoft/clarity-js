import {Token} from "@clarity-types/data";
import {INodeData} from "@clarity-types/dom";
import { Counter, Timer } from "@clarity-types/metrics";
import * as task from "@src/core/task";
import hash from "@src/data/hash";
import {check} from "@src/data/token";
import * as counter from "@src/metrics/counter";

import * as nodes from "./virtualdom";

window["HASH"] = hash;
let reference: number = 0;

export default async function(timer: Timer): Promise<Token[]> {
    let markup = [];
    let values = nodes.summarize();
    reference = 0;
    for (let value of values) {
        if (task.longtask(timer)) { await task.idle(timer); }
        let metadata = [];
        let layouts = [];
        let data: INodeData = value.data;
        let keys = ["tag", "layout", "attributes", "value"];
        for (let key of keys) {
            if (data[key]) {
                switch (key) {
                    case "tag":
                        counter.increment(Counter.Nodes);
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
                        let parent = nodes.getNode(value.parent);
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
    }
    return markup;
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
