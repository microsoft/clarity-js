import { IIgnoreLayoutState } from "@clarity-types/layout";
import { createGenericLayoutState, Tags } from "./generic";

export function createIgnoreLayoutState(node: Node): IIgnoreLayoutState {
    let layoutState = createGenericLayoutState(node, Tags.Ignore) as IIgnoreLayoutState;
    layoutState.nodeType = node.nodeType;
    if (node.nodeType === Node.ELEMENT_NODE) {
        layoutState.elementTag = (node as Element).tagName;
    }
    return layoutState;
}
