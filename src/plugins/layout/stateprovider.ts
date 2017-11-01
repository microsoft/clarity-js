import { IAttributes, IDoctypeLayoutState, IElementLayoutState,
   IIgnoreLayoutState, ILayoutState, ITextLayoutState } from "../../../clarity";
import { config } from "../../config";
import { assert } from "../../utils";
import { ShadowDom } from "./shadowdom";

export const NodeIndex = "clarity-index";
export const DoctypeTag = "*DOC*";
export const TextTag = "*TXT*";
export const IgnoreTag = "*IGNORE*";
const MetaTag = "META";
const ScriptTag = "SCRIPT";

let attributeMaskList = ["value", "placeholder", "alt", "title"];

export function getNodeIndex(node: Node): number {
  return (node && NodeIndex in node) ? node[NodeIndex] : null;
}

export function createLayoutState(node: Node, shadowDom: ShadowDom): ILayoutState {
  if (shouldIgnoreNode(node, shadowDom)) {
    return createIgnoreLayoutState(node);
  }

  let layoutState: ILayoutState = null;
  switch (node.nodeType) {
    case Node.DOCUMENT_TYPE_NODE:
      layoutState = createDoctypeLayoutState(node as DocumentType);
      break;
    case Node.TEXT_NODE:
      layoutState = createTextLayoutState(node as Text);
      break;
    case Node.ELEMENT_NODE:
      layoutState = createElementLayoutState(node as Element);
      break;
    default:
      layoutState = createIgnoreLayoutState(node);
      break;
  }

  return layoutState;
}

export function createDoctypeLayoutState(doctypeNode: DocumentType): IDoctypeLayoutState {
  let doctypeState = createGenericLayoutState(doctypeNode, DoctypeTag) as IDoctypeLayoutState;
  doctypeState.attributes = {
    name: doctypeNode.name,
    publicId: doctypeNode.publicId,
    systemId: doctypeNode.systemId
  };
  return doctypeState;
}

export function createElementLayoutState(element: Element): IElementLayoutState {
  let tagName = element.tagName;
  let elementState = createGenericLayoutState(element, tagName) as IElementLayoutState;

  // TODO: This should not be necessary here, look into removing this
  if (tagName === ScriptTag || tagName === MetaTag) {
    elementState.tag = IgnoreTag;
    return elementState;
  }

  elementState.attributes = getElementAttributes(element);
  elementState.layout = getElementLayoutRectangle(element);

  return elementState;
}

export function createTextLayoutState(textNode: Text): ITextLayoutState {
  // Text nodes that are children of the STYLE elements contain CSS code, so we don't want to hide it
  // Checking parentNode, instead of parentElement, because in IE textNode.parentElement returns 'undefined'.
  let showText = (textNode.parentNode && (textNode.parentNode as Element).tagName === "STYLE") ? true : config.showText;
  let textState = createGenericLayoutState(textNode, TextTag) as ITextLayoutState;
  textState.content = showText ? textNode.textContent : textNode.textContent.replace(/\S/gi, "*");
  return textState;
}

export function createIgnoreLayoutState(node: Node): IIgnoreLayoutState {
  let layoutState = createGenericLayoutState(node, IgnoreTag) as IIgnoreLayoutState;
  layoutState.nodeType = node.nodeType;
  if (node.nodeType === Node.ELEMENT_NODE) {
    layoutState.elementTag = (node as Element).tagName;
  }
  return layoutState;
}

export function createGenericLayoutState(node: Node, tag: string): ILayoutState {
  let layoutState: ILayoutState = {
    index: getNodeIndex(node),
    parent: getNodeIndex(node.parentNode),
    previous: getNodeIndex(node.previousSibling),
    next: getNodeIndex(node.nextSibling),
    tag
  };
  return layoutState;
}

export function shouldIgnoreNode(node: Node, shadowDom: ShadowDom): boolean {
  let shadowNode = shadowDom.getShadowNode(getNodeIndex(node));
  let ignore = false;
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      let tagName = (node as Element).tagName;
      if (tagName === ScriptTag || tagName === MetaTag) {
        ignore = true;
      }
      break;
    case Node.COMMENT_NODE:
      ignore = true;
      break;
    default:
      break;
  }

  // Ignore subtrees of ignored nodes (e.g. text with a <script> parent)
  if (!ignore) {
    let parentIndex = getNodeIndex(node.parentNode);
    if (parentIndex !== null) {
      let parentShadowNode = shadowDom.getShadowNode(parentIndex);
      assert(!!parentShadowNode, "shouldIgnoreNode", "parentShadowNode is missing");
      if (parentShadowNode && parentShadowNode.ignore && parentShadowNode.node !== document) {
        ignore = true;
      }
    }
  }
  return ignore;
}

export function getElementLayoutRectangle(element: Element): ILayoutRectangle {
  let layoutRect = null;
  // In IE, calling getBoundingClientRect on a node that is disconnected
  // from a DOM tree, sometimes results in a 'Unspecified Error'
  // Wrapping this in try/catch is faster than checking whether element is connected to DOM
  let rect = null;
  try {
    rect = element.getBoundingClientRect();
  } catch (e) {
    // Ignore
  }

  if (rect) {
    let styles = window.getComputedStyle(element);

    layoutRect = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };

    // Check if scroll is possible
    if (styles["overflow-x"] === "auto"
                              || styles["overflow-x"] === "scroll"
                              || styles["overflow-x"] === "hidden"
                              || styles["overflow-y"] === "auto"
                              || styles["overflow-y"] === "scroll"
                              || styles["overflow-y"] === "hidden") {
      layoutRect.scrollX = Math.round(element.scrollLeft);
      layoutRect.scrollY = Math.round(element.scrollTop);
    }
  }

  return layoutRect;
}

export function getElementAttributes(element: Element): IAttributes {
  let attributes: IAttributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    let name = element.attributes[i].name;
    let value = element.attributes[i].value;

    // Skip image sources, if config disallows showing images
    if (element.tagName === "IMG" && !config.showImages && name === "src") {
      continue;
    }

    // Mask text from input boxes and alt descriptions, if config disallows showing text
    if (!config.showText && attributeMaskList.indexOf(name) > -1) {
      value = value.replace(/\S/gi, "*");
    }

    attributes[name] = value;
  }
  return attributes;
}

function shouldMaskAttribute(attrName: string, element: Element): boolean {
  // Mask text from input boxes and alt descriptions, if config disallows showing text
  if (!config.showText && attributeMaskList.indexOf(attrName) > -1) {
    return true;
  }

  // Skip image sources, if config disallows showing images
  if (!config.showImages && element.tagName === "IMG" && attrName.toLowerCase() === "src") {
    return true;
  }

  return false;
}
