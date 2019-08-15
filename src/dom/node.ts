import { Source } from "@clarity-types/dom";
import config from "@src/core/config";
import * as virtualdom from "./virtualdom";

let ignoreAttributes = ["title", "alt", "onload", "onfocus"];

export default function(node: Node, source: Source): void {
    // Do not track this change if we are attempting to remove a node before discovering it
    if (source === Source.ChildListRemove && virtualdom.has(node) === false) { return; }

    let call = virtualdom.has(node) ? "update" : "add";
    switch (node.nodeType) {
        case Node.DOCUMENT_TYPE_NODE:
            let doctype = node as DocumentType;
            let docAttributes = { name: doctype.name, publicId: doctype.publicId, systemId: doctype.systemId };
            let docData = { tag: "*D", attributes: docAttributes };
            virtualdom[call](node, docData, source);
            break;
        case Node.TEXT_NODE:
            // Account for this text node only if we are tracking the parent node
            // We do not wish to track text nodes for ignored parent nodes, like script tags
            // Also, we do not track text nodes for STYLE tags
            // The only exception is when we receive a mutation to remove the text node, in that case
            // parent will be null, but we can still process the node by checking it's an update call.
            let parent = node.parentElement;
            if (call === "update" || (parent && virtualdom.has(parent) && parent.tagName !== "STYLE")) {
                let textData = { tag: "*T", value: node.nodeValue };
                textData["layout"] = getTextLayout(node);
                virtualdom[call](node, textData, source);
            }
            break;
        case Node.ELEMENT_NODE:
            let element = (node as HTMLElement);
            let tag = element.tagName;
            switch (tag) {
                case "SCRIPT":
                case "NOSCRIPT":
                case "META":
                    break;
                case "HEAD":
                    let head = { tag, attributes: getAttributes(element.attributes) };
                    // Capture base href as part of discovering DOM
                    if (call === "add") { head.attributes["*B"] = location.protocol + "//" + location.hostname; }
                    virtualdom[call](node, head, source);
                    break;
                case "STYLE":
                    let attributes = getAttributes(element.attributes);
                    let styleData = { tag, attributes, value: getStyleValue(element as HTMLStyleElement) };
                    virtualdom[call](node, styleData, source);
                    break;
                default:
                    let data = { tag, attributes: getAttributes(element.attributes) };
                    data["layout"] = getLayout(element);
                    virtualdom[call](node, data, source);
                    break;
            }
            break;
        default:
            break;
    }
}

function getStyleValue(style: HTMLStyleElement): string {
    let value = style.textContent;
    if (value.length === 0 || config.cssRules) {
        let cssRules = null;

        // Firefox throws a SecurityError when trying to access cssRules of a stylesheet from a different domain
        try {
            let sheet = style.sheet as CSSStyleSheet;
            cssRules = sheet ? sheet.cssRules : [];
        } catch (e) {
            if (e.name !== "SecurityError") {
                throw e;
            }
        }

        if (cssRules !== null) {
            for (let i = 0; i < cssRules.length; i++) {
                value += cssRules[i].cssText;
            }
        }
    }
    return value;
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
