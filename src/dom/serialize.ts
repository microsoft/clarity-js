import {nodes} from "../data/state";
import {INodeData, INodeValue} from "../lib/nodetree";

export default function(node: Node): string {
    let markup = serialize(node);
    return JSON.stringify(markup);
}

function serialize(node: Node): any {
    let markup = [];
    let value: INodeValue = nodes.get(node);
    let data: INodeData = value.data;
    let keys = ["tag", "attributes", "layout", "value", "children"];
    for (let key of keys) {
        if (data[key] || value[key]) {
            switch (key) {
                case "tag":
                    markup.push(value.id);
                    markup.push(value.parent);
                    markup.push(data[key]);
                    break;
                case "attributes":
                    for (let attr in data[key]) {
                        if (data[key][attr]) {
                            markup.push(`${attr}=${data[key][attr]}`);
                        }
                    }
                    break;
                case "layout":
                    markup.push(`${data[key]}`);
                    break;
                case "value":
                    let parent = nodes.node(value.parent);
                    let parentTag = nodes.get(parent).data.tag;
                    markup.push(`${text(parentTag, data[key])}`);
                    break;
                case "children":
                    if (value[key].length > 0) {
                        for (let i = 0; i < value[key].length; i++) {
                            let childNode = nodes.node(value[key][i]);
                            let child = serialize(childNode);
                            for (let j = 0; j < child.length; j++) {
                                markup.push(child[j]);
                            }
                        }
                    }
                    break;
            }
        }
    }
    return markup;
}

function text(tag: string, value: string): string {
    switch (tag) {
        case "STYLE":
        case "TITLE":
            return value;
        default:
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
