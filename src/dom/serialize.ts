import {nodes} from "../data/state";
import {INodeData, INodeValue} from "../lib/nodetree";

export default function serialize(node: Node): string {
    let markup = [];
    let children = [];
    let value: INodeValue = nodes.get(node);
    let data: INodeData = value.data;
    let keys = ["tag", "attributes", "layout", "value", "children"];
    for (let key of keys) {
        if (data[key] || value[key]) {
            switch (key) {
                case "tag":
                    if (data[key] !== "*TXT*") {
                        markup.push(data[key]);
                    }
                    break;
                case "attributes":
                    for (let attr in data[key]) {
                        if (data[key][attr]) {
                            markup.push(`"${attr}=${data[key][attr]}"`);
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
                            children.push(serialize(childNode));
                        }
                        markup.push(`[${children.join(",")}]`);
                    }
                    break;
            }
        }
    }
    return markup.join(" ");
}

function text(tag: string, value: string): string {
    switch (tag) {
        case "STYLE":
        case "TITLE":
            return value;
        default:
            let masked = "";
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
            masked += `${textCount}x${wordCount}`;
            return masked;
    }
}
