import { IIgnoreLayoutState, INodeInfo } from "@clarity-types/layout";
import { createGenericLayoutState, Tags } from "./generic";

export function createIgnoreLayoutState(node: Node): IIgnoreLayoutState {
    let layoutState = createGenericLayoutState(node, Tags.Ignore) as IIgnoreLayoutState;
    layoutState.nodeType = node.nodeType;
    if (node.nodeType === Node.ELEMENT_NODE) {
        layoutState.elementTag = (node as Element).tagName;
    }
    return layoutState;
}

export function shouldIgnoreNode(node: Node, parentInfo: INodeInfo): boolean {
    if (parentInfo && parentInfo.ignore) {
        return true;
    }

    let ignore = false;
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
            if (parentInfo && parentInfo.captureCssRules) {
                ignore = true;
            }
        default:
            break;
    }
    return ignore;
}
