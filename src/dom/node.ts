import {nodes} from "../data/state";

let ignoreAttributes = ["title", "alt", "onload", "onfocus"];

export default function(node: Node): void {
    let call = nodes.has(node) ? "update" : "add";
    switch (node.nodeType) {
        case Node.DOCUMENT_TYPE_NODE:
            let doctype = node as DocumentType;
            let docAttributes = { name: doctype.name, publicId: doctype.publicId, systemId: doctype.systemId };
            let docData = { tag: "*D", attributes: docAttributes };
            nodes[call](node, docData);
            break;
        case Node.TEXT_NODE:
            // Account for this text node only if we are tracking the parent node
            // We do not wish to track text nodes for ignored parent nodes, like script tags
            let parent = node.parentElement;
            if (parent && nodes.has(parent)) {
                let textData = { tag: "*T", value: node.nodeValue };
                textData["layout"] = getTextLayout(node);
                nodes[call](node, textData);
            }
            break;
        case Node.ELEMENT_NODE:
            let element = (node as HTMLElement);
            switch (element.tagName) {
                case "SCRIPT":
                case "NOSCRIPT":
                case "META":
                    break;
                default:
                    let data = { tag: element.tagName, attributes: getAttributes(element.attributes) };
                    data["layout"] = getLayout(element);
                    nodes[call](node, data);
                    break;
            }
            break;
        default:
            break;
    }
}

function getAttributes(attributes: NamedNodeMap): {[key: string]: string} {
    let output = {};
    if (attributes && attributes.length > 0) {
        for (let i = 0; i < attributes.length; i++) {
            let name = attributes[i].name;
            if (ignoreAttributes.indexOf(name) < 0) {
                output[name] = attributes[i].value;
            }
        }
    }
    return output;
}

function getTextLayout(textNode: Node): number[] {
    return [];
    let layout: number[] = [];
    let range = document.createRange();
    range.selectNodeContents(textNode);
    let rects = range.getClientRects();
    let doc = document.documentElement;
    for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        layout.push(Math.floor(rect.left) + ("pageXOffset" in window ? window.pageXOffset : doc.scrollLeft));
        layout.push(Math.floor(rect.top) + ("pageYOffset" in window ? window.pageYOffset : doc.scrollTop));
        layout.push(Math.round(rect.width));
        layout.push(Math.round(rect.height));
    }
    return layout;
}

function getLayout(element: Element): number[] {
    return [];
    // In IE, calling getBoundingClientRect on a node that is disconnected
    // from a DOM tree, sometimes results in a 'Unspecified Error'
    // Wrapping this in try/catch is faster than checking whether element is connected to DOM
    let layout: number[] = [];
    let rect = null;
    let doc = document.documentElement;
    try {
        rect = element.getBoundingClientRect();
    } catch (e) {
        // Ignore
    }

    if (rect && rect.width > 0 && rect.height > 0) {
        // getBoundingClientRect returns relative positioning to viewport and therefore needs
        // addition of window scroll position to get position relative to document
        // Also: using Math.floor() instead of Math.round() below because in Edge,
        // getBoundingClientRect returns partial pixel values (e.g. 162.5px) and Chrome already
        // floors the value (e.g. 162px). Keeping behavior consistent across
        layout = [
            Math.floor(rect.left) + ("pageXOffset" in window ? window.pageXOffset : doc.scrollLeft),
            Math.floor(rect.top) + ("pageYOffset" in window ? window.pageYOffset : doc.scrollTop),
            Math.round(rect.width),
            Math.round(rect.height)
        ];
    }
    return layout;
}
