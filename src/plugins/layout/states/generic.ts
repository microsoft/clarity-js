import { ILayoutState } from "@clarity-types/layout";

export const NodeIndex = "clarity-index";

export enum Tags {
    Meta = "META",
    Script = "SCRIPT",
    Doc = "*DOC*",
    Text = "*TXT*",
    Ignore = "*IGNORE*"
}

export function getNodeIndex(node: Node): number {
    return (node && NodeIndex in node) ? node[NodeIndex] : null;
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
