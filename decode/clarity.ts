import { DecodedToken, Event, IDecodedEvent, IEvent } from "../types/data";
import { IDecodedNode } from "../types/dom";
import dom from "./dom";
import metrics from "./metrics";

let nodes = {};
let placeholder = document.createElement("iframe");

export function json(payload: string): IDecodedEvent[] {
    let decoded: IDecodedEvent[] = [];
    let encoded: IEvent[] = JSON.parse(payload);
    for (let entry of encoded) {
        let exploded = { time: entry.t, event: entry.e, data: entry.d as DecodedToken[] };
        switch (entry.e) {
            case Event.Discover:
            case Event.Mutation:
                exploded.data = dom(entry.d);
                break;
            case Event.Metrics:
                exploded.data = metrics(entry.d);
                break;
        }
        decoded.push(exploded);
    }
    return decoded;
}

export function html(payload: string): string {
    let decoded = json(payload);
    for (let entry of decoded) {
        switch (entry.event) {
            case Event.Discover:
            case Event.Mutation:
                markup(entry.data);
                break;
        }
    }
    return placeholder.contentDocument.documentElement.outerHTML;
}

function markup(data: IDecodedNode[]): void {
    let doc = placeholder.contentDocument;
    for (let node of data) {
        let parent = element(node.parent);
        let next = element(node.next);
        switch (node.tag) {
            case "*D":
                if (typeof XMLSerializer !== "undefined" && false) {
                    doc.open();
                    doc.write(new XMLSerializer().serializeToString(
                        doc.implementation.createDocumentType(
                            node.attributes["name"],
                            node.attributes["publicId"],
                            node.attributes["systemId"]
                        )
                    ));
                    doc.close();
                }
                break;
            case "*T":
                let textElement = element(node.id);
                textElement = textElement ? textElement : doc.createTextNode(null);
                textElement.nodeValue = node.value;
                insert(node.id, parent, textElement, next);
                break;
            case "HTML":
                let newDoc = doc.implementation.createHTMLDocument("");
                let docElement = newDoc.documentElement;
                let pointer = doc.importNode(docElement, true);
                doc.replaceChild(pointer, doc.documentElement);
                if (doc.head) { doc.head.parentNode.removeChild(doc.head); }
                if (doc.body) { doc.body.parentNode.removeChild(doc.body); }
                nodes[node.id] = doc.documentElement;
                break;
            default:
                let domElement = element(node.id);
                domElement = domElement ? domElement : doc.createElement(node.tag);
                node.attributes["data-id"] = `${node.id}`;
                setAttributes(domElement as HTMLElement, node.attributes);
                insert(node.id, parent, domElement, next);
                break;
        }
    }
}

function element(nodeId: number): Node {
    return nodeId !== null && nodeId > 0 && nodeId in nodes ? nodes[nodeId] : null;
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
