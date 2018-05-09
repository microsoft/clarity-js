import { IAttributes, IDoctypeLayoutState, IElementLayoutState, IIgnoreLayoutState, ILayoutRectangle, ILayoutState, IStyleLayoutState,
  ITextLayoutState } from "../../../clarity";
import { config } from "../../config";
import { mask } from "../../utils";

export const NodeIndex = "clarity-index";
const DefaultAttributeMaskList = ["value", "placeholder", "alt", "title"];

export enum Tags {
  Meta = "META",
  Script = "SCRIPT",
  Doc = "*DOC*",
  Text = "*TXT*",
  Ignore = "*IGNORE*"
}

enum Styles {
  Color = "color",
  BackgroundColor = "backgroundColor",
  BackgroundImage = "backgroundImage",
  OverflowX = "overflowX",
  OverflowY = "overflowY",
  Visibility = "visibility"
}

let defaultColor: string;
let attributeMaskList: string[];

export function resetStateProvider() {
  attributeMaskList = DefaultAttributeMaskList.concat(config.sensitiveAttributes);
  defaultColor = "";
}

export function getNodeIndex(node: Node): number {
  return (node && NodeIndex in node) ? node[NodeIndex] : null;
}

export function createLayoutState(node: Node, ignore: boolean, forceMask: boolean): ILayoutState {
  let state: ILayoutState = null;
  let maskText = forceMask || !config.showText;
  let maskImages = forceMask || !config.showImages;
  if (ignore) {
    state = createIgnoreLayoutState(node);
  } else {
    switch (node.nodeType) {
      case Node.DOCUMENT_TYPE_NODE:
        state = createDoctypeLayoutState(node as DocumentType);
        break;
      case Node.TEXT_NODE:
        state = createTextLayoutState(node as Text, maskText);
        break;
      case Node.ELEMENT_NODE:
        let elem = node as Element;
        if (elem.tagName === "STYLE") {
          state = createStyleLayoutState(elem as HTMLStyleElement, maskText);
        } else {
          state = createElementLayoutState(elem, maskText, maskImages);
        }
        break;
      default:
        state = createIgnoreLayoutState(node);
        break;
    }
  }
  return state;
}

export function createDoctypeLayoutState(doctypeNode: DocumentType): IDoctypeLayoutState {
  let doctypeState = createGenericLayoutState(doctypeNode, Tags.Doc) as IDoctypeLayoutState;
  doctypeState.attributes = {
    name: doctypeNode.name,
    publicId: doctypeNode.publicId,
    systemId: doctypeNode.systemId
  };
  return doctypeState;
}

export function createElementLayoutState(element: Element, maskText: boolean, maskImages: boolean): IElementLayoutState {
  let tagName = element.tagName;
  let elementState = createGenericLayoutState(element, tagName) as IElementLayoutState;
  if (tagName === Tags.Script || tagName === Tags.Meta) {
    elementState.tag = Tags.Ignore;
    return elementState;
  }

  // Get attributes for the element
  elementState.attributes = getAttributes(element, maskText, maskImages);

  // Get layout bounding box for the element
  elementState.layout = getLayout(element);

  // Get computed systems for the element with valid layout
  elementState.style = elementState.layout ? getStyles(element) : null;

  // Check if scroll is possible
  if (elementState.layout && elementState.style && (Styles.OverflowX in elementState.style || Styles.OverflowX in elementState.style)) {
    elementState.layout.scrollX = Math.round(element.scrollLeft);
    elementState.layout.scrollY = Math.round(element.scrollTop);
  }

  return elementState;
}

export function createStyleLayoutState(styleNode: HTMLStyleElement, maskText: boolean): IStyleLayoutState {
  let layoutState = createElementLayoutState(styleNode, maskText, false) as IStyleLayoutState;
  if (config.cssRules) {
    let cssRules = layoutState.cssRules = null;

    // Firefox throws a SecurityError when trying to access cssRules of a stylesheet from a different domain
    try {
      let sheet = styleNode.sheet as CSSStyleSheet;
      cssRules = sheet ? sheet.cssRules : [];
    } catch (e) {
      if (e.name !== "SecurityError") {
        throw e;
      }
    }
    if (cssRules !== null) {
      layoutState.cssRules = [];
      for (let i = 0; i < cssRules.length; i++) {
        layoutState.cssRules.push(cssRules[i].cssText);
      }
    }
  }
  return layoutState;
}

export function createTextLayoutState(textNode: Text, maskText: boolean): ITextLayoutState {
  // Text nodes that are children of the STYLE elements contain CSS code, so we don't want to hide it
  // Checking parentNode, instead of parentElement, because in IE textNode.parentElement returns 'undefined'.
  let parent = textNode.parentNode;
  let isCss = parent && parent.nodeType === Node.ELEMENT_NODE && (parent as Element).tagName === "STYLE";
  let showText = isCss || !maskText;
  let textState = createGenericLayoutState(textNode, Tags.Text) as ITextLayoutState;
  textState.content = showText ? textNode.nodeValue : mask(textNode.nodeValue);
  return textState;
}

export function createIgnoreLayoutState(node: Node): IIgnoreLayoutState {
  let layoutState = createGenericLayoutState(node, Tags.Ignore) as IIgnoreLayoutState;
  layoutState.nodeType = node.nodeType;
  if (node.nodeType === Node.ELEMENT_NODE) {
    layoutState.elementTag = (node as Element).tagName;
  }
  return layoutState;
}

export function createGenericLayoutState(node: Node, tag: string): ILayoutState {
  let layoutIndex = getNodeIndex(node);
  let state: ILayoutState = {
    index: layoutIndex,
    parent: getNodeIndex(node.parentNode),
    previous: getNodeIndex(node.previousSibling),
    next: getNodeIndex(node.nextSibling),
    source: null,
    action: null,
    tag
  };
  return state;
}

function getLayout(element): ILayoutRectangle {
  let layout: ILayoutRectangle = null;
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

function getAttributes(element: Element, maskText: boolean, maskImages: boolean): IAttributes {
  let elementAttributes = element.attributes;
  let tagName = element.tagName;
  let stateAttributes: IAttributes = {};

  for (let i = 0; i < elementAttributes.length; i++) {
    let attr = elementAttributes[i];
    let attrName = attr.name.toLowerCase();

    // If it's an image and configuration disallows capturing images then skip src attribute
    if (maskImages && tagName === "IMG" && attrName === "src") {
      continue;
    }

    // If we are masking text, also mask it from input boxes as well as alt description
    if (maskText && attributeMaskList.indexOf(attrName) >= 0) {
      stateAttributes[attr.name] = mask(attr.value);
    } else {
      stateAttributes[attr.name] = attr.value;
    }
  }

  return stateAttributes;
}

function getStyles(element) {
  let computed = window.getComputedStyle(element);
  let style = {};

  if (defaultColor.length === 0) {
    defaultColor = computed[Styles.Color];
  }

  // Send computed styles, if relevant, back to server
  if (match(computed[Styles.Visibility], ["hidden", "collapse"])) {
    style[Styles.Visibility] = computed[Styles.Visibility];
  }

  if (match(computed[Styles.OverflowX], ["auto", "scroll", "hidden"])) {
    style[Styles.OverflowX] = computed[Styles.OverflowX];
  }

  if (match(computed[Styles.OverflowY], ["auto", "scroll", "hidden"])) {
    style[Styles.OverflowY] = computed[Styles.OverflowY];
  }

  if (computed[Styles.BackgroundImage] !== "none") {
    style[Styles.BackgroundImage] = computed[Styles.BackgroundImage];
  }

  if (!match(computed[Styles.BackgroundColor], ["rgba(0, 0, 0, 0)", "transparent"])) {
    style[Styles.BackgroundColor] = computed[Styles.BackgroundColor];
  }

  if (computed[Styles.Color] !== defaultColor) {
    style[Styles.Color] = computed[Styles.Color];
  }

  return Object.keys(style).length > 0 ? style : null;
}

function match(variable: string, values: string[]): boolean {
  return values.indexOf(variable) > -1;
}
