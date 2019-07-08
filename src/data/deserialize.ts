import { resolve } from "@src/data/token";

let nodes = {};
let placeholder = document.createElement("iframe");
// debug: visualize it on page
placeholder.height = "350";
document.body.appendChild(placeholder);

export default function(payload: string): string {
    let tokens = JSON.parse(payload);
    let number = 0;
    let lastType = null;
    let node = [];
    let intermediate = [];
    let tagIndex = 0;
    for (let token of tokens) {
        let type = typeof(token);
        switch (type) {
            case "number":
                if (type !== lastType && lastType !== null) {
                    process(node, tagIndex);
                    intermediate.push(...node);
                    node = [];
                    tagIndex = 0;
                }
                number += token;
                token = token === 0 ? token : number;
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
                        let keys = resolve(token);
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

    let markup = placeholder.contentDocument.documentElement.outerHTML;

    return JSON.stringify(intermediate) + "\r\n" + markup;
}

function process(node: any[] | number[], tagIndex: number): void {
    let id = node[0];
    let parent = tagIndex > 1 ? element(node[1]) : null;
    let next = tagIndex > 2 ? element(node[2]) : null;
    let layouts = [];
    let tag = node[tagIndex];
    let doc = placeholder.contentDocument;
    let content = null;
    let attributes = {};

    for (let i = tagIndex + 1; i < node.length; i++) {
        let token = node[i] as string;
        let keyIndex = token.indexOf("=");
        let parts = token.split("*");
        if (tag !== "*T" && keyIndex > 0) {
            attributes[token.substr(0, keyIndex)] = token.substr(keyIndex + 1);
        } else if (parts.length === 4) {
            let layout = [];
            for (let part of parts) {
                layout.push(parseInt(part, 36));
            }
            layouts.push(layout);
        } else if (tag === "*T" && parts.length === 2) {
            let textCount = parseInt(parts[0], 36);
            let wordCount = parseInt(parts[1], 36);
            content = wordCount > 0 && textCount === 0 ? " " : Array((textCount + 1) / 2).join("* ");
        } else if (tag === "*T") {
            content = token;
        }
    }

    switch (tag) {
        case "*D":
            if (typeof XMLSerializer !== "undefined" && false) {
                doc.open();
                doc.write(new XMLSerializer().serializeToString(
                    doc.implementation.createDocumentType(
                        attributes["name"],
                        attributes["publicId"],
                        attributes["systemId"]
                    )
                ));
                doc.close();
            }
            break;
        case "*T":
            let textElement = element(id);
            textElement = textElement ? textElement : doc.createTextNode(null);
            textElement.nodeValue = content;
            insert(id, parent, textElement, next);
            break;
        case "HTML":
            let newDoc = doc.implementation.createHTMLDocument("");
            let html = newDoc.documentElement;
            let pointer = doc.importNode(html, true);
            doc.replaceChild(pointer, doc.documentElement);
            if (doc.head) { doc.head.parentNode.removeChild(doc.head); }
            if (doc.body) { doc.body.parentNode.removeChild(doc.body); }
            nodes[id] = doc.documentElement;
            break;
        default:
            let domElement = element(id);
            domElement = domElement ? domElement : doc.createElement(tag);
            attributes["data-id"] = id;
            setAttributes(domElement as HTMLElement, attributes);
            insert(id, parent, domElement, next);
            break;
    }
}

function element(nodeId: number): Node {
    return nodeId > 0 && nodeId in nodes ? nodes[nodeId] : null;
}

function insert(id: number, parent: Node, node: Node, next: Node): void {
    parent.insertBefore(node, next);
    nodes[id] = node;
}

function setAttributes(node: HTMLElement, attributes: object): void {
    for (let attribute in node.attributes) {
        if (node.hasAttribute(attribute)) {
            node.removeAttribute(attribute);
        }
    }
    for (let attribute in attributes) {
        if (attributes[attribute]) {
            node.setAttribute(attribute, attributes[attribute]);
        }
    }
}
