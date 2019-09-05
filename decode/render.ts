import { Event } from "../types/data";
import { IMouse, IResize, IScroll, ISelection } from "../types/interaction";
import { IBoxModel, IChecksum, IDecodedNode } from "../types/layout";
import { IDecodedMetric } from "../types/metric";

let nodes = {};
let svgns: string = "http://www.w3.org/2000/svg";
let thrift = false;

// tslint:disable-next-line: max-line-length
let pointerIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6AAAdTAAAOpgAAA6lwAAF2+XqZnUAAACaUlEQVR4nGL8f58BHYgAsT8Q2wGxBBAzQcX/AfFrID4CxOuA+BWKLoX/YAoggBjRDHQD4ngglgRiPgyrIOAzEL8E4lVQg1EMBAggFiSFYUAcA8RSOAyCAV4oTgViTiBeiiwJEEAw71gRaRgyEAXiKCB2RBYECCCQgcIMEG+SYhgMiANxEhDzwwQAAghkoAMQK5NhGAwoALE1jAMQQCADQU7mpMBAZqijwAAggEAGqgAxOwUGskHNAAOAAAIZyEtIh4INg3bfHHD6xAUEYAyAAAIZ+IuQgU9fMLCXdzDIzV3JIIhDyQ8YAyCAQAaCUv8/fAZysDP8+/OXgTG7jkFhwRoMQ0F6n8M4AAEEMvAKsg34wM9fDEwgQ1dtRSQTIPgNxFdhHIAAAhm4AYg/EmMgCHz7zsCUVMaguHob3FCQYzbD5AECCGTgJSDeCbWJKPD1GwNzSjmD4tZ9DFxgvQr/b8PkAAIIlvVWA/FuUgz99IWBOTyXQcE+nOEOsjhAACGXNnJAHAnE9kAshqyIV5vB4Ms3cALGBkAlj9////9PgTgAAcSEJPEIiDuBeBYQP2CAhOt3BsLJCpSfNzAyMpqDOAABhF4ewh3FAMmf2kAsyqnBUPDjJ8HcdBvoSjWAAGIEEgTUMTAAbf/AwICSVGCgD4hPgJQA8WegWdsBAogFiyJC4C0QgxI3KLj4gIasRpYECCAGkAsJYSAAuRDEAKUEQwZIzgDxvwCxCrJagAAi1kAQAYpFESh/BlQMhJuR1QIEELEGlgOxHBLflAGSh0Gc60DMBpMDCCCiDMRhyXoGSJUaDgpPmDhAgAEAN5Ugk0bMYNIAAAAASUVORK5CYII=";
// tslint:disable-next-line: max-line-length
let clickIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6AAAdTAAAOpgAAA6lwAAF2+XqZnUAAADvklEQVR4nGL8//8/AzJgZGQQAVL+QGwHxBJAzASV+gfEr4H4CBCvA2p7xYAFAAQQI7KBQMPcgFQ8EEsCMR82DUDwGYhfAvEqoNZ16JIAAQQ3EGhYGJCKAWIpHAahA5BrlwC1L0UWBAggJqhhViQaBgKiQBwF1OuILAgQQExAAWEGiDeRDJsEFOM1AFplzMCgrcnAcIoTh6HiQJwENIMfJgAQQCAXOgCxMkLNaqBkvgIDg8Z3BoaC5wwMz9kYGKIVGRg+MjFgB0C1DNYwDkAAgRSBnIzkgnUCDAyswIBdf4+Bof8ZA0PHYwaGO0D5/Tw4DGSGOgoMAAIIZKAKELMj5D8AFXD+BUbyXwhf9Scw5QAt+MmIw0A2qBlgABBAIAN5cSgkBQjAGAABxALEv1BdiA4YobgFmDZPcjMwZLyB+JILmNAl/0AV/YCpBgggkIGg9MTNgMgRWAAL0MuvWRkYJgNzznRgzP4AqmUHGpj/AhgFnxgYlD4yMKiBVQIEEMiQK8g2YAJQ2JUAY/vFZQaGmfeBvgO6qhUYUU5AQ7qASc1Tg4FB35+RkRGUXRkAAgjkwg0MDMedGBh2AW3m+QtxCQuSgZxAl9h+gbAtvzEwJAN9VAXMxzc+Qlwa+JSBoRQUZL1AvBEggECB4wdMJqsYGH6zQ8IKlBWlgOF6/SowpoGGvQKaDgoqKSDxCWjAA2Cs6gF99AXIfgLEGsuA+kAJuwqYjRkBAgjk5S5gQQL00vHJDAwnLgFz1G9gPCElEbE/EMNAAGSBHjR4eIBiGtuBjKVQV4ABQACBDASG5t/dDAwWPQwMZkDbJlyApMG/UEN38UBc9hvIPwCMPFDy/AmM6UnXgN6eDywcniKHOEAAgQw8BsRBQGezASU7gfm9jYGh8hxQIzD2GIDZ7yYwjXwHuuYPMIHfApr2HxghbxcBY/giA4PmE6TUAgYAAQRilALxASCeBYwpb2A4bGBkTNnLAMmf2sDYBWbN73cZGDiAZeBxYBlp1w00CBg5DBlIXpUH4mcgBkAAMUDLw2So5CQQHxkDQRwQCzFAEn8oAyRVg/J+IVQM5ChgvmfYDFIPEEDIGudCDQ1HM9CFAZI9gckJXC2AggmUfwOh8mpQfZUgPkAAIWsEaToOxF+B2ATdpbgwEKRCDbQB8QECCF1SB4hBkXEeiPmJNBCUbEDZlwfEBwgg5CwBUnAFGDHpQCYw+TBsAbI3MUBqO2xFFyj9CELDdRlQLzg3AQQQLlujoAH9H6oRG/4HlT8ExCowvQABBgBOKHD8+UgEvgAAAABJRU5ErkJggg==";

export function reset(): void {
    nodes = {};
}

export function metrics(data: IDecodedMetric, header: HTMLElement): void {
    let html = [];

    let entries = {...data.counters, ...data.measures};
    for (let metric in entries) {
        if (entries[metric]) {
            let m = entries[metric];
            html.push(`<li><h2>${value(m.value, m.unit)}<span>${m.unit}</span></h2>${metric}</li>`);
        }
    }

    header.innerHTML = `<ul>${html.join("")}</ul>`;
}

function value(input: number, unit: string): number {
    switch (unit) {
        case "KB": return Math.round(input / 1024);
        case "s": return Math.round(input / 1000);
        default: return input;
    }
}

export function checksum(data: IChecksum[], iframe: HTMLIFrameElement): void {
    thrift = true;
}

export function boxmodel(data: IBoxModel[], iframe: HTMLIFrameElement): void {
    let doc = iframe.contentDocument;
    for (let bm of data) {
        let el = element(bm.id) as HTMLElement;
        switch (thrift) {
            case true:
                let box = el ? el : doc.createElement("DIV");
                box.style.left = bm.box[0] + "px";
                box.style.top = bm.box[1] + "px";
                box.style.width = bm.box[2] + "px";
                box.style.height = bm.box[3] + "px";
                box.style.position = "absolute";
                box.style.border = "1px solid red";
                doc.body.appendChild(box);
                nodes[bm.id] = box;
                break;
            case false:
                if (el) {
                    el.style.maxWidth = bm.box[2] + "px";
                    el.style.minWidth = Math.max(bm.box[2] - 5, 0) + "px";
                    el.style.height = bm.box[3] + "px";
                    el.style.overflow = "hidden";
                    el.style.wordBreak = "break-all";
                }
                break;
        }
    }
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
                setAttributes(doc.documentElement as HTMLElement, node.attributes);
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
    if (tag && tag.indexOf("svg:") === 0) {
        return doc.createElementNS(svgns, tag) as HTMLElement;
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
            console.warn("Node: " + node + " | Parent: " + parent + " | Data: " + JSON.stringify(data));
            console.warn("Exception encountered while inserting node: " + ex);
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
                if (attribute.indexOf("xlink:") === 0) {
                    node.setAttributeNS("http://www.w3.org/1999/xlink", attribute, attributes[attribute]);
                } else {
                    node.setAttribute(attribute, attributes[attribute]);
                }
            } catch (ex) {
                console.warn("Node: " + node + " | " + JSON.stringify(attributes));
                console.warn("Exception encountered while adding attributes: " + ex);
            }
        }
    }
}

export function scroll(data: IScroll, iframe: HTMLIFrameElement): void {
    let target = getNode(data.target);
    if (target) { target.scrollTo(data.x, data.y); }
}

export function resize(data: IResize, iframe: HTMLIFrameElement): void {
    iframe.removeAttribute("style");
    let margin = 10;
    let px = "px";
    let width = data.width;
    let height = data.height;
    let availableWidth = (iframe.contentWindow.innerWidth - (2 * margin));
    let scaleWidth = Math.min(availableWidth / width, 1);
    let scaleHeight = Math.min((iframe.contentWindow.innerHeight - (16 * margin)) / height, 1);
    let scale = Math.min(scaleWidth, scaleHeight);
    iframe.style.position = "relative";
    iframe.style.width = width + px;
    iframe.style.height = height + px;
    iframe.style.left = ((availableWidth - (width * scale)) / 2) + px;
    iframe.style.transformOrigin = "0 0 0";
    iframe.style.transform = "scale(" + scale + ")";
    iframe.style.border = "1px solid #cccccc";
    iframe.style.margin = margin + px;
    iframe.style.overflow = "hidden";
}

export function selection(data: ISelection, iframe: HTMLIFrameElement): void {
    let doc = iframe.contentDocument;
    let s = doc.getSelection();
    s.setBaseAndExtent(element(data.start), data.startOffset, element(data.end), data.endOffset);
}

export function mouse(event: Event, data: IMouse, iframe: HTMLIFrameElement): void {
    let doc = iframe.contentDocument;
    let pointer = doc.getElementById("clarity-pointer");
    let pointerWidth = 20;
    let pointerHeight = 24;

    if (pointer === null) {
        pointer = doc.createElement("DIV");
        pointer.id = "clarity-pointer";
        pointer.style.position = "absolute";
        pointer.style.zIndex = "1000";
        pointer.style.width = pointerWidth + "px";
        pointer.style.height = pointerHeight + "px";
        doc.body.appendChild(pointer);
    }

    pointer.style.left = (data.x - 8) + "px";
    pointer.style.top = (data.y - 8) + "px";
    switch (event) {
        case Event.Click:
            pointer.style.background = `url(${clickIcon}) no-repeat left center`;
            break;
        default:
            pointer.style.background = `url(${pointerIcon}) no-repeat left center`;
            break;
    }
}

function getNode(id: number): HTMLElement {
    return id in nodes ? nodes[id] : null;
}
