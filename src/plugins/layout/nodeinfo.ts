import { ILayoutState, INodeInfo } from "../../../types/index";
import { config } from "../../config";
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
        if (config.cssRules && node.parentNode && (node.parentNode as Element).tagName === "STYLE") {
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
