import { ILayoutState } from "@clarity-types/layout";
import { createDoctypeLayoutState } from "./doctype";
import { createElementLayoutState, resetElementStateProvider } from "./element";
import { createIgnoreLayoutState } from "./ignore";
import { createStyleLayoutState } from "./style";
import { createTextLayoutState } from "./text";

export function createLayoutState(node: Node, ignore: boolean, forceMask: boolean): ILayoutState {
    let state: ILayoutState = null;
    if (ignore) {
        state = createIgnoreLayoutState(node);
    } else {
        switch (node.nodeType) {
            case Node.DOCUMENT_TYPE_NODE:
                state = createDoctypeLayoutState(node as DocumentType);
                break;
            case Node.TEXT_NODE:
                state = createTextLayoutState(node as Text);
                break;
            case Node.ELEMENT_NODE:
                let elem = node as Element;
                if (elem.tagName === "STYLE") {
                    state = createStyleLayoutState(elem as HTMLStyleElement);
                } else {
                    state = createElementLayoutState(elem);
                }
                break;
            default:
                state = createIgnoreLayoutState(node);
                break;
        }
    }
    return state;
}

export function resetStateProvider(): void {
    resetElementStateProvider();
}
