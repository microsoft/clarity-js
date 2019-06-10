import {nodes} from "../data/state";

let ignoreAttributes = ["title", "alt"];

export default function(node: Node): void {
    let parent = node.parentElement;
    switch (node.nodeType) {
        case Node.DOCUMENT_TYPE_NODE:
            let doctype = node as DocumentType;
            nodes.add(parent, node, {
                tag: "*DOC*",
                attributes: {
                    name: doctype.name,
                    publicId: doctype.publicId,
                    systemId: doctype.systemId
                }
            });
            break;
        case Node.TEXT_NODE:
            // Account for this text node only if we are tracking the parent node
            if (parent && nodes.has(parent)) {
                // nodes.update(parent, {leaf: true});
                nodes.add(parent, node, {
                    tag: "*TXT*",
                    leaf: false,
                    value: node.nodeValue,
                    layout: getTextLayout(node)
                });
            }
            break;
        case Node.ELEMENT_NODE:
            let element = ( node as HTMLElement);
            switch (element.tagName) {
                case "SCRIPT":
                case "NOSCRIPT":
                case "META":
                    break;
                default:
                    nodes.add(parent, node, {
                        tag: element.tagName,
                        leaf: node.childNodes.length === 0,
                        attributes: getAttributes(element.attributes),
                        layout: getLayout(element)
                    });
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

function getTextLayout(textNode: Node): string {
    let layouts: string[] = [];
    let range = document.createRange();
    range.selectNodeContents(textNode);
    let rects = range.getClientRects();
    let doc = document.documentElement;
    for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        layouts.push([
            Math.floor(rect.left) + ("pageXOffset" in window ? window.pageXOffset : doc.scrollLeft),
            Math.floor(rect.top) + ("pageYOffset" in window ? window.pageYOffset : doc.scrollTop),
            Math.round(rect.width),
            Math.round(rect.height)
        ].join("x"));
    }
    return layouts.join(".");
}

function getLayout(element: Element): string {
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

    if (rect) {
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
    return layout.join("x");
}
