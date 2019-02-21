import { ITextLayoutState } from "@clarity-types/layout";
import { mask } from "@src/utils";
import { createGenericLayoutState, Tags } from "./generic";

export function createTextLayoutState(textNode: Text): ITextLayoutState {
    // Text nodes that are children of the STYLE elements contain CSS code, so we don't want to hide it
    // Checking parentNode, instead of parentElement, because in IE textNode.parentElement returns 'undefined'.
    let parent = textNode.parentNode;
    let isCss = parent && parent.nodeType === Node.ELEMENT_NODE && (parent as Element).tagName === "STYLE";
    let textState = createGenericLayoutState(textNode, Tags.Text) as ITextLayoutState;
    textState.content = isCss ? textNode.nodeValue : mask(textNode.nodeValue);
    return textState;
}
