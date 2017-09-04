import { config } from "../../config";
import { profile } from "../../core";
import { assert } from "../../utils";
import { ShadowDom } from "./shadowdom";

export const NodeIndex = "clarity-index";
export const DoctypeTag = "*DOC*";
export const TextTag = "*TXT*";
export const IgnoreTag = "*IGNORE*";
const MetaTag = "META";
const ScriptTag = "SCRIPT";
const HeadTags = [MetaTag, ScriptTag, "TITLE", "STYLE", "LINK"];

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
  if (tagName === ScriptTag || tagName === MetaTag) {
    elementState.tag = IgnoreTag;
    return elementState;
  }

  let elementAttributes = element.attributes;
  let stateAttributes: IAttributes = {};
  for (let i = 0; i < elementAttributes.length; i++) {
    let attr = elementAttributes[i];
    let attrName = attr.name.toLowerCase();

    // If it's an image and configuration disallows capturing images then skip src attribute
    if (tagName === "IMG" && !config.showImages && attrName === "src") {
      continue;
    }

    // If we are masking text, also mask it from input boxes as well as alt description
    if (!config.showText && attributeMaskList.indexOf(attrName) >= 0) {
      stateAttributes[attr.name] = attr.value.replace(/\S/gi, "*");
    } else {
      stateAttributes[attr.name] = attr.value;
    }
  }
  elementState.attributes = stateAttributes;

  // In IE, calling getBoundingClientRect on a node that is disconnected
  // from a DOM tree, sometimes results in a 'Unspecified Error'
  // Wrapping this in try/catch is faster than checking whether element is connected to DOM
  let rect = null;
  elementState.layout = null;

  let label = "boxmodel";
  profile(label);
  if (shouldCaptureBoxModel(element)) {
    try {
      rect = element.getBoundingClientRect();
    } catch (e) {
      // Ignore
    }

    if (rect) {
      let styles = window.getComputedStyle(element);
      elementState.layout = {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      };

      // Capture overflow style if it's different from default value
      if (styles["overflow"] === "hidden" || styles["overflow-x"] === "hidden" || styles["overflow-y"] === "hidden") {
        elementState.layout.overflow = "hidden";
      }

      // Capture visibility if it's different from default value
      if (styles["visibility"] === "hidden") {
        elementState.layout.visibility = styles["visibility"];
      }

      // Capture color based on the configuration
      if (styles["color"] && config.fetchColor) {
        elementState.layout.color = styles["color"];
      }
    }
  }
  profile(label);

  return elementState;
}

export function createTextLayoutState(textNode: Text): ITextLayoutState {
  // Text nodes that are children of the STYLE elements contain CSS code, so we don't want to hide it
  let showText = (textNode.parentElement && textNode.parentElement.tagName === "STYLE") ? true : config.showText;
  let textState = createGenericLayoutState(textNode, TextTag) as ITextLayoutState;
  textState.content = showText ? textNode.textContent : textNode.textContent.replace(/\S/gi, "*");

  if (config.showLines) {
    let range = document.createRange();
    range.selectNodeContents(textNode);
    let lines = range.getClientRects();
    if (lines.length > 0) {
      textState.lines = [];
      for (let i = 0; i < lines.length; i++) {
        textState.lines.push({
          x: Math.round(lines[i].left),
          y: Math.round(lines[i].top),
          width: Math.round(lines[i].width),
          height: Math.round(lines[i].height)
        });
      }
    }
  }

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
    source: null,
    action: null,
    tag
  };
  return layoutState;
}

export function shouldCaptureBoxModel(element) {
  if (HeadTags.indexOf(element.tagName) >= 0) {
    return false;
  }

  let childNodes = element.childNodes;

  // For box model, we will capture all elements at the leaf level
  // We determine that by ensuring there are no child nodes
  if (childNodes.length === 0 && element.nodeType !== Node.TEXT_NODE) {
    return true;
  }

  // Also, we include nodes that include TEXT_NODE as one of the child nodes
  for (let node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE || node.tagName === "IMG") {
      return true;
    }
  }

  return false;
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
