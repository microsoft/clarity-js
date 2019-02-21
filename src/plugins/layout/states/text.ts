import { INodeInfo, ITextLayoutState } from "@clarity-types/layout";
import { mask } from "@src/utils";
import { createGenericLayoutState, Tags } from "./generic";

export function createTextLayoutState(textNode: Text, info: INodeInfo): ITextLayoutState {
    // Text nodes that are children of the STYLE elements contain CSS code, so we don't want to hide it
    // Checking parentNode, instead of parentElement, because in IE textNode.parentElement returns 'undefined'.
    let textState = createGenericLayoutState(textNode, Tags.Text) as ITextLayoutState;
    textState.content = info.isCss ? textNode.nodeValue : mask(textNode.nodeValue);
    return textState;
}

export function isCssText(node: Node): boolean {
    let isCss = false;
    if (node.nodeType === Node.TEXT_NODE) {
        let parent = node.parentNode;
        isCss = parent && parent.nodeType === Node.ELEMENT_NODE && (parent as Element).tagName === "STYLE";
    }
    return isCss;
}
