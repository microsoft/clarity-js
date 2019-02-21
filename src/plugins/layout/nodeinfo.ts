import { INodeInfo } from "@clarity-types/layout";
import { shouldIgnoreNode } from "./states/ignore";
import { isCssText } from "./states/text";

export const UnmaskAttribute = "data-clarity-unmask";

export function createNodeInfo(node: Node, parentInfo: INodeInfo): INodeInfo {
  let ignore = shouldIgnoreNode(node, parentInfo);
  let unmask = shouldUnmaskNode(node, parentInfo);
  let isCss = isCssText(node);
  return { ignore, unmask, isCss };
}

function shouldUnmaskNode(node: Node, parentInfo: INodeInfo): boolean {
  const parentUnmasked = parentInfo ? parentInfo.unmask : false;
  const hasUnmaskAttribute = (
    node && node.nodeType === Node.ELEMENT_NODE
      ? (node as Element).getAttribute(UnmaskAttribute) === "true"
      : false
  );
  return hasUnmaskAttribute || parentUnmasked;
}
