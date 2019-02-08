import { ILayoutState, INodeInfo } from "@clarity-types/layout";
import { createLayoutState, getNodeIndex, Tags } from "./stateprovider";

export const ForceMaskAttribute = "data-clarity-mask";

export function createNodeInfo(node: Node, parentInfo: INodeInfo): INodeInfo {
  let index = getNodeIndex(node);
  let ignore = shouldIgnoreNode(node, parentInfo ? parentInfo.ignore : false);
  let forceMask = shouldForceMaskNode(node, parentInfo ? parentInfo.forceMask : false);
  let state: ILayoutState = createLayoutState(node, ignore, forceMask);
  return { index, ignore, forceMask, state };
}

export function shouldIgnoreNode(node: Node, parentIgnored: boolean): boolean {
  let ignore = parentIgnored;
  if (!parentIgnored) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        let tagName = (node as Element).tagName;
        if (tagName === Tags.Script || tagName === Tags.Meta) {
          ignore = true;
        }
        break;
      case Node.COMMENT_NODE:
        ignore = true;
        break;
      case Node.TEXT_NODE:
        // If we capture CSSRules on style elements, ignore its text children nodes
        // Since iterating over css rules can be 100X slower on certain browsers,
        // we limit ignoring text nodes to STYLE elements with empty text content
        let parent = node.parentNode as Element;
        if (parent && parent.tagName === "STYLE" && parent.textContent.length === 0) {
          ignore = true;
        }
      default:
        break;
    }
  }
  return ignore;
}

function shouldForceMaskNode(node: Node, parentForceMasked: boolean): boolean {
  let mask = parentForceMasked;
  if (!mask) {
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      mask = (node as Element).getAttribute(ForceMaskAttribute) === "true";
    }
  }
  return mask;
}
