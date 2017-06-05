import { config } from "../../config";
import { assert } from "../../utils";
import { ShadowDom } from "./shadowdom";

export const NodeIndex = "clarity-index";
export const DoctypeTag = "*DOC*";
export const IgnoreTag = "*IGNORE*";
export const TextTag = "*TXT*";

export function getNodeIndex(node: Node): number {
  let index: number = null;
  if (node && NodeIndex in node) {
    index = node[NodeIndex];
  }
  return index;
}

export function createLayoutState(node: Node, shadowDom: ShadowDom): ILayoutState {
  let layoutState: ILayoutState = null;
  let parent = node.parentNode;
  let parentIndex = getNodeIndex(parent);

  // If parent is ignored, ignore this node as well
  // Because nodes are processed in document order, parent
  // should always have the 'ignored' flag before child is processed
  if (parentIndex !== null) {
    let parentShadowNode = shadowDom.getShadowNode(parentIndex);
    assert(parentShadowNode !== null, "createLayoutState");
    if (parentShadowNode.ignore && parentShadowNode.node !== document) {
      layoutState = createGenericLayoutState(node, IgnoreTag);
      return layoutState;
    }
  }

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
      layoutState = createGenericLayoutState(node, IgnoreTag);
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
  if (tagName === "SCRIPT" || tagName === "META") {
    elementState.tag = IgnoreTag;
    return elementState;
  }

  let elementAttributes = element.attributes;
  let stateAttributes: IAttributes = {};
  for (let i = 0; i < elementAttributes.length; i++) {
    let attr = elementAttributes[i];

    // If it's an image and configuration disallows capturing images then skip src attribute
    if (tagName === "IMG" && !config.showImages && attr.name.toUpperCase() === "SRC") {
      continue;
    }

    stateAttributes[attr.name] = attr.value;
  }
  elementState.attributes = stateAttributes;

  // In IE, calling getBoundingClientRect on a node that is disconnected
  // from a DOM tree, sometimes results in a 'Unspecified Error'
  // Wrapping this in try/catch is faster than checking whether element is connected to DOM
  let rect = null;
  try {
    rect = element.getBoundingClientRect();
  } catch (e) {
    // Ignore
  }

  elementState.layout = null;
  if (rect) {
    elementState.layout = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }

  return elementState;
}

export function createTextLayoutState(textNode: Text): ITextLayoutState {
  // Text nodes that are children of the STYLE elements contain CSS code, so we don't want to hide it
  let showText = (textNode.parentElement && textNode.parentElement.tagName === "STYLE") ? true : config.showText;
  let textState = createGenericLayoutState(textNode, TextTag) as ITextLayoutState;
  textState.content = showText ? textNode.textContent : textNode.textContent.replace(/\S/gi, "*");
  return textState;
}

export function createGenericLayoutState(node: Node, tag: string): ILayoutState {
  let layoutState: ILayoutState = {
    index: getNodeIndex(node),
    parent: getNodeIndex(node.parentNode),
    previous: getNodeIndex(node.previousSibling),
    next: getNodeIndex(node.nextSibling),
    source: null,
    action: null,
    tag
  };
  return layoutState;
}
