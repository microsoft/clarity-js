import {Event, Token} from "@clarity-types/data";
import {INodeData} from "@clarity-types/layout";
import {Metric} from "@clarity-types/metric";
import config from "@src/core/config";
import * as task from "@src/core/task";
import time from "@src/core/time";
import hash from "@src/data/hash";
import {check} from "@src/data/token";
import * as metric from "@src/metric";
import * as boxmodel from "./boxmodel";
import {doc} from "./document";
import * as dom from "./dom";

window["HASH"] = hash;

export default async function(type: Event): Promise<Token[]> {
    let tokens: Token[] = [time(), type];
    let timer = type === Event.Discover ? Metric.DiscoverTime : Metric.MutationTime;
    switch (type) {
        case Event.Document:
            let d = doc;
            tokens.push(d.width);
            tokens.push(d.height);
            metric.measure(Metric.DocumentWidth, d.width);
            metric.measure(Metric.DocumentHeight, d.height);
            return tokens;
        case Event.BoxModel:
            let bm = boxmodel.summarize();
            for (let value of bm) {
                tokens.push(value.id);
                tokens.push(value.box);
            }
            return tokens;
        case Event.Discover:
        case Event.Mutation:
            let values = dom.summarize();
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
                                metric.counter(Metric.Nodes);
                                tokens.push(value.id);
                                if (value.parent) { tokens.push(value.parent); }
                                if (value.next) { tokens.push(value.next); }
                                metadata.push(data[key]);
                                break;
                            case "attributes":
                                for (let attr in data[key]) {
                                    if (data[key][attr] !== undefined) {
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
                                let parent = dom.getNode(value.parent);
                                let parentTag = dom.get(parent) ? dom.get(parent).data.tag : null;
                                let tag = value.data.tag === "STYLE" ? value.data.tag : parentTag;
                                metadata.push(text(tag, data[key]));
                                break;
                        }
                    }
                }

                // Add metadata
                metadata = meta(metadata);
                for (let token of metadata) {
                    let index: number = typeof token === "string" ? tokens.indexOf(token) : -1;
                    tokens.push(index >= 0 && token.length > index.toString().length ? [index] : token);
                }
                // Add layout boxes
                for (let entry of layouts) {
                    tokens.push(entry);
                }
            }
            return tokens;
        }
}

function meta(metadata: string[]): string[] | string[][] {
    let value = JSON.stringify(metadata);
    let hashed = hash(value);
    return check(hashed) && hashed.length < value.length ? [[hashed]] : metadata;
}

function text(tag: string, value: string): string {
    switch (tag) {
        case "STYLE":
        case "TITLE":
            return value;
        default:
            if (config.showText) { return value; }
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
