import { IAttributes, IDoctypeLayoutState, IElementLayoutState, IIgnoreLayoutState, ILayoutState, ILayoutStyle, IStyleLayoutState,
  ITextLayoutState } from "../../../clarity";
import { config } from "../../config";
import { assert } from "../../utils";

export const NodeIndex = "clarity-index";
export const DoctypeTag = "*DOC*";
export const TextTag = "*TXT*";
export const IgnoreTag = "*IGNORE*";

enum Token {
  Meta = "META",
  Script = "SCRIPT",
  Color = "color",
  BackgroundColor = "backgroundColor",
  BackgroundImage = "backgroundImage",
  OverflowX = "overflowX",
  OverflowY = "overflowY"
}

let attributeMaskList = ["value", "placeholder", "alt", "title"];
let layoutStates: ILayoutState[];
let defaultStyles = {};

export function resetStateProvider() {
  layoutStates = [];
  defaultStyles = {};
}

export function getNodeIndex(node: Node): number {
  return (node && NodeIndex in node) ? node[NodeIndex] : null;
}

export function createLayoutState(node: Node): ILayoutState {
  if (shouldIgnoreNode(node)) {
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
      let elem = node as Element;
      if (elem.tagName === "STYLE") {
        layoutState = createStyleLayoutState(elem as HTMLStyleElement);
      } else {
        layoutState = createElementLayoutState(elem);
      }
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
  if (tagName === Token.Script || tagName === Token.Meta) {
    elementState.tag = IgnoreTag;
    return elementState;
  }

  elementState.attributes = getAttributes(element);
  elementState.layout = getLayout(element);
  elementState.style = elementState.layout ? getStyles(element) : null;

  // Check if scroll is possible
  if (elementState.layout && elementState.style && (Token.OverflowX in elementState.style || Token.OverflowX in elementState.style)) {
    elementState.layout.scrollX = Math.round(element.scrollLeft);
    elementState.layout.scrollY = Math.round(element.scrollTop);
  }

  return elementState;
}

function getLayout(element) {
  let layout = null;
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
    layout = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }
  return layout;
}

function getAttributes(element) {
  let elementAttributes = element.attributes;
  let tagName = element.tagName;
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
  return stateAttributes;
}

function getStyles(element) {
    let computed = window.getComputedStyle(element);
    let style = {};

    if (!(Token.Color in defaultStyles)) {
      defaultStyles[Token.Color] = computed[Token.Color];
      defaultStyles[Token.BackgroundColor] = computed[Token.BackgroundColor];
    }

    // Send computed styles, if relevant, back to server
    if (match(computed[Token.OverflowX], ["auto", "scroll", "hidden"])) {
      style[Token.OverflowX] = computed[Token.OverflowX];
    }

    if (match(computed[Token.OverflowY], ["auto", "scroll", "hidden"])) {
      style[Token.OverflowY] = computed[Token.OverflowY];
    }

    if (computed[Token.BackgroundImage] !== "none") {
      style[Token.BackgroundImage] = computed[Token.BackgroundImage];
    }

    if (computed[Token.BackgroundColor] !== defaultStyles[Token.BackgroundColor]) {
      style[Token.BackgroundColor] = computed[Token.BackgroundColor];
    }

    if (computed[Token.Color] !== defaultStyles[Token.Color]) {
      style[Token.Color] = computed[Token.Color];
    }

    return Object.keys(style).length > 0 ? style : null;
}

function match(variable, values) {
  for (let i = 0; i < values.length; i++) {
    if (variable === values[i]) {
      return true;
    }
  }
  return false;
}

export function createStyleLayoutState(styleNode: HTMLStyleElement): IStyleLayoutState {
  let layoutState = createElementLayoutState(styleNode) as IStyleLayoutState;
  let cssRules = (styleNode.sheet as CSSStyleSheet).cssRules;
  let cssRulesTexts = [];
  for (let i = 0; i < cssRules.length; i++) {
    cssRulesTexts.push(cssRules[i].cssText);
  }
  layoutState.cssRules = cssRulesTexts;
  return layoutState;
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
  let layoutIndex = getNodeIndex(node);
  layoutStates[layoutIndex] = {
    index: layoutIndex,
    parent: getNodeIndex(node.parentNode),
    previous: getNodeIndex(node.previousSibling),
    next: getNodeIndex(node.nextSibling),
    source: null,
    action: null,
    tag
  };

  return layoutStates[layoutIndex];
}

export function shouldIgnoreNode(node: Node): boolean {
  let ignore = false;
  switch (node.nodeType) {
    case Node.ELEMENT_NODE:
      let tagName = (node as Element).tagName;
      if (tagName === Token.Script || tagName === Token.Meta) {
        ignore = true;
      }
      break;
    case Node.COMMENT_NODE:
      ignore = true;
      break;
    case Node.TEXT_NODE:
      // If we capture CSSRules on style elements, ignore its text children nodes
      if (config.cssRules && (node.parentNode as Element).tagName === "STYLE") {
        ignore = true;
      }
    default:
      break;
  }

  // Ignore subtrees of ignored nodes (e.g. text with a <script> parent)
  if (!ignore) {
    let parentIndex = getNodeIndex(node.parentNode);
    if (parentIndex !== null && parentIndex > 0) {
      let parentState = layoutStates[parentIndex];
      if (parentState && parentState.tag === IgnoreTag) {
        ignore = true;
      }
    }
  }
  return ignore;
}

export function getLayoutState(index) {
  return layoutStates[index];
}
