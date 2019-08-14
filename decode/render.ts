import { IDecodedNode } from "../types/dom";
import { IDecodedMetric, IMetricMapValue } from "../types/metrics";
import { IResizeViewport } from "../types/viewport";

let nodes = {};
let svgns: string = "http://www.w3.org/2000/svg";

export function reset(): void {
    nodes = {};
}

export function metrics(data: IDecodedMetric, header: HTMLElement): void {
    let html = [];

    // Counters
    for (let metric in data.counters) {
        if (data.counters[metric]) {
            let map = data.map[metric];
            let v = value(data.counters[metric], map.unit);
            html.push(metricBox(v, data.map[metric]));
        }
    }

    // Summary
    for (let metric in data.measures) {
        if (data.measures[metric]) {
            let m = data.measures[metric];
            let map = data.map[metric];
            let unit = map.unit;
            let v = value(map.value ? m[map.value] : m.sum, unit);
            let metadata = map.value === "max" ? `#${m.count} Min: ${value(m.min, unit)}` : `#${m.count} Max: ${value(m.max, unit)}`;
            html.push(metricBox(v, data.map[metric], metadata));
        }
    }

    header.innerHTML = `<ul>${html.join("")}</ul>`;
}

function value(input: number, unit: string): number {
    switch (unit) {
        case "KB": return Math.round(input / 1024);
        default: return input;
    }
}

function metricBox(metric: number, map: IMetricMapValue, metadata: string = null): string {
    metadata = metadata || "";
    return `<li><h2>${metric}<span>${map.unit}</span><div>${metadata}</div></h2>${map.name}</li>`;
}

export function markup(data: IDecodedNode[], iframe: HTMLIFrameElement): void {
    let doc = iframe.contentDocument;
    for (let node of data) {
        let parent = element(node.parent);
        let next = element(node.next);
        switch (node.tag) {
            case "*D":
                if (typeof XMLSerializer !== "undefined") {
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
                insert(node, parent, textElement, next);
                break;
            case "HTML":
                let docElement = element(node.id);
                if (docElement === null) {
                    let newDoc = doc.implementation.createHTMLDocument("");
                    docElement = newDoc.documentElement;
                    let pointer = doc.importNode(docElement, true);
                    doc.replaceChild(pointer, doc.documentElement);
                    if (doc.head) { doc.head.parentNode.removeChild(doc.head); }
                    if (doc.body) { doc.body.parentNode.removeChild(doc.body); }
                }
                setAttributes(docElement as HTMLElement, node.attributes);
                nodes[node.id] = doc.documentElement;
                break;
            case "HEAD":
                let headElement = element(node.id);
                if (headElement === null) {
                    headElement = doc.createElement(node.tag);
                    let base = doc.createElement("base");
                    base.href = node.attributes["*B"];
                    headElement.appendChild(base);
                    delete node.attributes["*B"];
                }
                setAttributes(headElement as HTMLElement, node.attributes);
                insert(node, parent, headElement, next);
                break;
            case "STYLE":
                let styleElement = element(node.id);
                styleElement = styleElement ? styleElement : doc.createElement(node.tag);
                setAttributes(styleElement as HTMLElement, node.attributes);
                styleElement.textContent = node.value;
                insert(node, parent, styleElement, next);
            default:
                let domElement = element(node.id);
                domElement = domElement ? domElement : createElement(doc, node.tag, parent as HTMLElement);
                if (!node.attributes) { node.attributes = {}; }
                node.attributes["data-id"] = `${node.id}`;
                setAttributes(domElement as HTMLElement, node.attributes);
                insert(node, parent, domElement, next);
                break;
        }
    }
}

function createElement(doc: Document, tag: string, parent: HTMLElement): HTMLElement {
    if (tag === "svg") {
        return doc.createElementNS(svgns, tag) as HTMLElement;
    } else {
        while (parent && parent.tagName !== "BODY") {
            if (parent.tagName === "svg") {
                return doc.createElementNS(svgns, tag) as HTMLElement;
            }
            parent = parent.parentElement;
        }
    }
    return doc.createElement(tag);
}

function element(nodeId: number): Node {
    return nodeId !== null && nodeId > 0 && nodeId in nodes ? nodes[nodeId] : null;
}

function insert(data: IDecodedNode, parent: Node, node: Node, next: Node): void {
    if (parent !== null) {
        next = next && next.parentElement !== parent ? null : next;
        try {
            parent.insertBefore(node, next);
        } catch (ex) {
            console.error("Node: " + node + " | Parent: " + parent);
            console.error("Exception encountered while inserting node: " + ex);
        }
    } else if (parent === null && node.parentElement !== null) {
        node.parentElement.removeChild(node);
    }
    nodes[data.id] = node;
}

function setAttributes(node: HTMLElement, attributes: object): void {
    // First remove all its existing attributes
    if (node.attributes) {
        let length = node.attributes.length;
        while (node.attributes && length > 0) {
            node.removeAttribute(node.attributes[0].name);
            length--;
        }
    }

    // Add new attributes
    for (let attribute in attributes) {
        if (attributes[attribute] !== undefined) {
            try {
                node.setAttribute(attribute, attributes[attribute]);
            } catch (ex) {
                console.error("Node: " + node + " | " + JSON.stringify(attributes));
                console.error("Exception encountered while adding attributes: " + ex);
            }
        }
    }
}

export function resize(data: IResizeViewport, placeholder: HTMLIFrameElement): void {
    placeholder.removeAttribute("style");
    let margin = 10;
    let px = "px";
    let width = data.width;
    let height = data.height;
    let availableWidth = (placeholder.contentWindow.innerWidth - (2 * margin));
    let scaleWidth = Math.min(availableWidth / width, 1);
    let scaleHeight = Math.min((placeholder.contentWindow.innerHeight - (16 * margin)) / height, 1);
    let scale = Math.min(scaleWidth, scaleHeight);
    placeholder.style.position = "relative";
    placeholder.style.width = width + px;
    placeholder.style.height = height + px;
    placeholder.style.left = ((availableWidth - (width * scale)) / 2) + px;
    placeholder.style.transformOrigin = "0 0 0";
    placeholder.style.transform = "scale(" + scale + ")";
    placeholder.style.border = "1px solid #cccccc";
    placeholder.style.margin = margin + px;
    placeholder.style.overflow = "hidden";
}
