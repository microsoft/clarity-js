import { Event } from "../types/data";
import { IChange, IPointer, IResize, IScroll, ISelection } from "../types/interaction";
import { IBoxModel, IChecksum, IDecodedNode } from "../types/layout";
import { IMetric, Metric } from "../types/metric";

let nodes = {};
let boxmodels = {};
let metrics: IMetric = null;
let svgns: string = "http://www.w3.org/2000/svg";
let lean = false;
const METRIC_MAP = {};
METRIC_MAP[Metric.Nodes] = { name: "Node Count", unit: ""};
METRIC_MAP[Metric.LayoutBytes] = { name: "Layout Bytes", unit: "KB"};
METRIC_MAP[Metric.InteractionBytes] = { name: "Interaction Bytes", unit: "KB"};
METRIC_MAP[Metric.NetworkBytes] = { name: "Network Bytes", unit: "KB"};
METRIC_MAP[Metric.DiagnosticBytes] = { name: "Diagnostic Bytes", unit: "KB"};
METRIC_MAP[Metric.Mutations] = { name: "Mutation Count", unit: ""};
METRIC_MAP[Metric.Interactions] = { name: "Interaction Count", unit: ""};
METRIC_MAP[Metric.Clicks] = { name: "Click Count", unit: ""};
METRIC_MAP[Metric.Selections] = { name: "Selection Count", unit: ""};
METRIC_MAP[Metric.ScriptErrors] = { name: "Script Errors", unit: ""};
METRIC_MAP[Metric.ImageErrors] = { name: "Image Errors", unit: ""};
METRIC_MAP[Metric.DiscoverTime] = { name: "Discover Time", unit: "ms"};
METRIC_MAP[Metric.MutationTime] = { name: "Mutation Time", unit: "ms"};
METRIC_MAP[Metric.BoxModelTime] = { name: "Box Model Time", unit: "ms"};
METRIC_MAP[Metric.StartTime] = { name: "Start Time", unit: "s"};
METRIC_MAP[Metric.ActiveTime] = { name: "Active Time", unit: "ms"};
METRIC_MAP[Metric.EndTime] = { name: "End Time", unit: "s"};
METRIC_MAP[Metric.ViewportWidth] = { name: "Viewport Width", unit: "px"};
METRIC_MAP[Metric.ViewportHeight] = { name: "Viewport Height", unit: "px"};
METRIC_MAP[Metric.DocumentWidth] = { name: "Document Width", unit: "px"};
METRIC_MAP[Metric.DocumentHeight] = { name: "Document Height", unit: "px"};

// tslint:disable-next-line: max-line-length
let pointerIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6AAAdTAAAOpgAAA6lwAAF2+XqZnUAAACaUlEQVR4nGL8f58BHYgAsT8Q2wGxBBAzQcX/AfFrID4CxOuA+BWKLoX/YAoggBjRDHQD4ngglgRiPgyrIOAzEL8E4lVQg1EMBAggFiSFYUAcA8RSOAyCAV4oTgViTiBeiiwJEEAw71gRaRgyEAXiKCB2RBYECCCQgcIMEG+SYhgMiANxEhDzwwQAAghkoAMQK5NhGAwoALE1jAMQQCADQU7mpMBAZqijwAAggEAGqgAxOwUGskHNAAOAAAIZyEtIh4INg3bfHHD6xAUEYAyAAAIZ+IuQgU9fMLCXdzDIzV3JIIhDyQ8YAyCAQAaCUv8/fAZysDP8+/OXgTG7jkFhwRoMQ0F6n8M4AAEEMvAKsg34wM9fDEwgQ1dtRSQTIPgNxFdhHIAAAhm4AYg/EmMgCHz7zsCUVMaguHob3FCQYzbD5AECCGTgJSDeCbWJKPD1GwNzSjmD4tZ9DFxgvQr/b8PkAAIIlvVWA/FuUgz99IWBOTyXQcE+nOEOsjhAACGXNnJAHAnE9kAshqyIV5vB4Ms3cALGBkAlj9////9PgTgAAcSEJPEIiDuBeBYQP2CAhOt3BsLJCpSfNzAyMpqDOAABhF4ewh3FAMmf2kAsyqnBUPDjJ8HcdBvoSjWAAGIEEgTUMTAAbf/AwICSVGCgD4hPgJQA8WegWdsBAogFiyJC4C0QgxI3KLj4gIasRpYECCAGkAsJYSAAuRDEAKUEQwZIzgDxvwCxCrJagAAi1kAQAYpFESh/BlQMhJuR1QIEELEGlgOxHBLflAGSh0Gc60DMBpMDCCCiDMRhyXoGSJUaDgpPmDhAgAEAN5Ugk0bMYNIAAAAASUVORK5CYII=";
// tslint:disable-next-line: max-line-length
let clickIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6AAAdTAAAOpgAAA6lwAAF2+XqZnUAAADvklEQVR4nGL8//8/AzJgZGQQAVL+QGwHxBJAzASV+gfEr4H4CBCvA2p7xYAFAAQQI7KBQMPcgFQ8EEsCMR82DUDwGYhfAvEqoNZ16JIAAQQ3EGhYGJCKAWIpHAahA5BrlwC1L0UWBAggJqhhViQaBgKiQBwF1OuILAgQQExAAWEGiDeRDJsEFOM1AFplzMCgrcnAcIoTh6HiQJwENIMfJgAQQCAXOgCxMkLNaqBkvgIDg8Z3BoaC5wwMz9kYGKIVGRg+MjFgB0C1DNYwDkAAgRSBnIzkgnUCDAyswIBdf4+Bof8ZA0PHYwaGO0D5/Tw4DGSGOgoMAAIIZKAKELMj5D8AFXD+BUbyXwhf9Scw5QAt+MmIw0A2qBlgABBAIAN5cSgkBQjAGAABxALEv1BdiA4YobgFmDZPcjMwZLyB+JILmNAl/0AV/YCpBgggkIGg9MTNgMgRWAAL0MuvWRkYJgNzznRgzP4AqmUHGpj/AhgFnxgYlD4yMKiBVQIEEMiQK8g2YAJQ2JUAY/vFZQaGmfeBvgO6qhUYUU5AQ7qASc1Tg4FB35+RkRGUXRkAAgjkwg0MDMedGBh2AW3m+QtxCQuSgZxAl9h+gbAtvzEwJAN9VAXMxzc+Qlwa+JSBoRQUZL1AvBEggECB4wdMJqsYGH6zQ8IKlBWlgOF6/SowpoGGvQKaDgoqKSDxCWjAA2Cs6gF99AXIfgLEGsuA+kAJuwqYjRkBAgjk5S5gQQL00vHJDAwnLgFz1G9gPCElEbE/EMNAAGSBHjR4eIBiGtuBjKVQV4ABQACBDASG5t/dDAwWPQwMZkDbJlyApMG/UEN38UBc9hvIPwCMPFDy/AmM6UnXgN6eDywcniKHOEAAgQw8BsRBQGezASU7gfm9jYGh8hxQIzD2GIDZ7yYwjXwHuuYPMIHfApr2HxghbxcBY/giA4PmE6TUAgYAAQRilALxASCeBYwpb2A4bGBkTNnLAMmf2sDYBWbN73cZGDiAZeBxYBlp1w00CBg5DBlIXpUH4mcgBkAAMUDLw2So5CQQHxkDQRwQCzFAEn8oAyRVg/J+IVQM5ChgvmfYDFIPEEDIGudCDQ1HM9CFAZI9gckJXC2AggmUfwOh8mpQfZUgPkAAIWsEaToOxF+B2ATdpbgwEKRCDbQB8QECCF1SB4hBkXEeiPmJNBCUbEDZlwfEBwgg5CwBUnAFGDHpQCYw+TBsAbI3MUBqO2xFFyj9CELDdRlQLzg3AQQQLlujoAH9H6oRG/4HlT8ExCowvQABBgBOKHD8+UgEvgAAAABJRU5ErkJggg==";
// tslint:disable-next-line: max-line-length
let touchIcon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAYCAYAAAD6S912AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxOS0wOS0xMVQwNjo1MzozMC0wNzowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTktMDktMTFUMDY6NTQ6NDAtMDc6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTktMDktMTFUMDY6NTQ6NDAtMDc6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ODZmNTE5ZGQtN2E3MS1hOTQyLTgwNTktMjc3OTJjNTM1YTNlIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjg2ZjUxOWRkLTdhNzEtYTk0Mi04MDU5LTI3NzkyYzUzNWEzZSIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjg2ZjUxOWRkLTdhNzEtYTk0Mi04MDU5LTI3NzkyYzUzNWEzZSI+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6ODZmNTE5ZGQtN2E3MS1hOTQyLTgwNTktMjc3OTJjNTM1YTNlIiBzdEV2dDp3aGVuPSIyMDE5LTA5LTExVDA2OjUzOjMwLTA3OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgqF3McAAAOgSURBVDiNlZVdbBRVFMd/d7o7penS7c6ghT60JRLCRx9s0JAIUvajJtCkVYw1IVaKUr/wpQk+qO8YRV8aEw3Q1EjpAwkNlkZNDMEYxUDoh9gSH7CNrXQptbtsHeluu7vHh5kuQ90l8k9ucuece373zJl77igRwa1YXK0BmoFdwFpAc1xZYBb4EegzAnKbPFJuYCyungEOAOuAsnwBwN/ADHDGCEhfQWAsrlqAl4DKAqCVmgV6jICcdhs1B/bUQ8IAHgH2x+IqeB8wFlcm9mvmYOFwq2kavsdNg22msWVzf39VSQFoBfBKLK787gx3A48tG44cCfpHhk/VwKYFn+9QFKL6wTZ9/Z07mvYfnK0aYIcbGARyGXzR/Wg5eOXq4Oj4H5Mnp3fVN0zBjZJjHz3tKwAscpLKATcAxcsGkUQRlGQMYzED0Ng4mgJNLEtXBYC6w8gBVxdY+DAqdwMXH7RSKQBFT090XXVVe+XQULl+7VqZPjWle1zLkssTD/Z5KuVeR+SRR2DWa1ndaxsingpIalCc9ftfu/XW4aH5UOhGIhK+l+Goe4eVsixdmeaB6Fxs5tdIw7MTUJ6urj40BaFEInG88oOjVzc1RJLNSqnmZeC5s2fXZ2u3tlfs3NG2Bma9duK2AoGF7OG3r1gAHR0X75pm0+zQ8MnbX39z5SYEE3V1rddBpoFP7OJAE3jPwFKx/ShA5eL4xK0xvz+bjUa9nlSqiJqaZDqR0LTBwQo9FIomLUtpY2OGtn37XK9p4AfeExGlgN+gqPjEiarzHm+m/mDbwmYQxidio35/NvuA75UFLgCfmgZvAu+LiNKAjZD5bt/zEx83NU32trRsG4GyTDqtKYDOzjpfIqFpS0uorq4tpZkMpFL8FQ63Xr982ew2AnLTvYsGXAL2mQa6EZAPP/v826P1u58cSqfVPLDQ/1VtkWV50um0Sg0M1GZEmIpGV305Mnzql7175v50nZbc5B3ge+C4UqpRRM719akL2P25dXJyVXB+Xv+9tDQ9c+knvWxw0Dy2d8/cXeANp+AA1cA0AM59+Krj7BQR3AN4GTCw2/MF7N4tATocmwcYB86LCO7ALgf64gpgBLs9vdi/BQ27f59z/BuduHdXAlcDPwP/AE+szLTQANod4M77gI6zFpgHhgH//wSexm5fn4jgbnBEZFQp9TrQCwwopfqd85bv6soAAaeuvSJi5T5Knl33O4UWJzDfyDr+H4ANy7H/AvM1z7/FQv/oAAAAAElFTkSuQmCC";

export function reset(): void {
    nodes = {};
    boxmodels = {};
    metrics = { counters: {}, measures: {}, tags: [] };
}

export function metric(data: IMetric, header: HTMLElement): void {
    let html = [];

    // Copy over counters
    for (let counter in data.counters) {
        if (data.counters[counter]) { metrics.counters[counter] = data.counters[counter]; }
    }

    // Copy over measures
    for (let measure in data.measures) {
        if (data.measures[measure]) { metrics.measures[measure] = data.measures[measure]; }
    }

    let entries = {...metrics.counters, ...metrics.measures};
    for (let entry in entries) {
        if (entries[entry]) {
            let m = entries[entry];
            let map = METRIC_MAP[entry];
            html.push(`<li><h2>${value(m, map.unit)}<span>${map.unit}</span></h2>${map.name}</li>`);
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
    lean = true;
}

export function boxmodel(data: IBoxModel[], iframe: HTMLIFrameElement): void {
    let doc = iframe.contentDocument;
    for (let bm of data) {
        let el = element(bm.id) as HTMLElement;
        if (lean) {
            let box = el ? el : doc.createElement("DIV");
            box.style.left = bm.box[0] + "px";
            box.style.top = bm.box[1] + "px";
            box.style.width = bm.box[2] + "px";
            box.style.height = bm.box[3] + "px";
            box.style.position = "absolute";
            box.style.border = "1px solid red";
            doc.body.appendChild(box);
            nodes[bm.id] = box;
        } else if (el && el.tagName === "IFRAME") {
            let s = getComputedStyle(el, null);
            let width = bm.box[2];
            let height = bm.box[3];
            if (s["boxSizing"] !== "border-box") {
                width -= (css(s, "paddingLeft") + css(s, "paddingRight") + css(s, "borderLeftWidth") + css(s, "borderRightWidth"));
                height -= (css(s, "paddingTop") + css(s, "paddingBottom") + css(s, "borderTopWidth") + css(s, "borderBottomWidth"));
            }
            el.style.width = width + "px";
            el.style.height = height + "px";
            if (el.tagName === "IFRAME") { el.style.backgroundColor = "maroon"; }
            boxmodels[bm.id] = bm;
        }
    }
}

function css(style: CSSStyleDeclaration, field: string): number {
    return parseInt(style[field], 10);
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
                    let p = doc.importNode(docElement, true);
                    doc.replaceChild(p, doc.documentElement);
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
                break;
            default:
                let domElement = element(node.id);
                domElement = domElement ? domElement : createElement(doc, node.tag, parent as HTMLElement);
                if (!node.attributes) { node.attributes = {}; }
                node.attributes["data-id"] = `${node.id}`;
                setAttributes(domElement as HTMLElement, node.attributes);
                if (node.id in boxmodels) { boxmodel([boxmodels[node.id]], iframe); }
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
        node = null;
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

export function change(data: IChange, iframe: HTMLIFrameElement): void {
    let el = element(data.target) as HTMLInputElement;
    if (el) { el.value = data.value; }
}

export function selection(data: ISelection, iframe: HTMLIFrameElement): void {
    let doc = iframe.contentDocument;
    let s = doc.getSelection();
    s.setBaseAndExtent(element(data.start), data.startOffset, element(data.end), data.endOffset);
}

export function pointer(event: Event, data: IPointer, iframe: HTMLIFrameElement): void {
    let doc = iframe.contentDocument;
    let p = doc.getElementById("clarity-pointer");
    let pointerWidth = 20;
    let pointerHeight = 24;

    if (p === null) {
        p = doc.createElement("DIV");
        p.id = "clarity-pointer";
        p.style.position = "absolute";
        p.style.zIndex = "1000";
        p.style.width = pointerWidth + "px";
        p.style.height = pointerHeight + "px";
        doc.body.appendChild(p);
    }

    p.style.left = (data.x - 8) + "px";
    p.style.top = (data.y - 8) + "px";
    switch (event) {
        case Event.Click:
        case Event.RightClick:
        case Event.DoubleClick:
            p.style.background = `url(${clickIcon}) no-repeat left center`;
            break;
        case Event.TouchMove:
        case Event.TouchStart:
        case Event.TouchEnd:
        case Event.TouchCancel:
            p.style.background = `url(${touchIcon}) no-repeat left center`;
            break;
        default:
            p.style.background = `url(${pointerIcon}) no-repeat left center`;
            break;
    }
}

function getNode(id: number): HTMLElement {
    return id in nodes ? nodes[id] : null;
}
