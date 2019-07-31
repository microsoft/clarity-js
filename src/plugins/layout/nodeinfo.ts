import { INodeInfo } from "@clarity-types/layout";
import { shouldIgnoreNode } from "./states/ignore";
import { shouldCaptureCssRules } from "./states/style";
import { isCssText } from "./states/text";

export const UnmaskAttribute = "data-clarity-unmask";
export const MaskAttribute = "data-clarity-mask";

export function createNodeInfo(node: Node, parentInfo: INodeInfo): INodeInfo {
  let ignore = shouldIgnoreNode(node, parentInfo);
  let unmask = shouldUnmaskNode(node, parentInfo);
  let isCss = isCssText(node);
  let captureCssRules = shouldCaptureCssRules(node);
  return { ignore, unmask, isCss, captureCssRules };
}

function shouldUnmaskNode(node: Node, parentInfo: INodeInfo): boolean {
  const parentUnmasked = parentInfo ? parentInfo.unmask : false;
  const hasUnmaskAttribute = (
    node && node.nodeType === Node.ELEMENT_NODE
      ? (node as Element).getAttribute(UnmaskAttribute) === "true"
      : false
  );
  // mask attribute takes precedence over any unmask above
  const hasMaskAttribute = (
    node && node.nodeType === Node.ELEMENT_NODE
      ? (node as Element).getAttribute(MaskAttribute) === "true"
      : false
  );
  return !hasMaskAttribute && (hasUnmaskAttribute || parentUnmasked);
}
