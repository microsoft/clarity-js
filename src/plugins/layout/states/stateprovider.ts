import { ILayoutState, INodeInfo } from "@clarity-types/layout";
import { createDoctypeLayoutState } from "./doctype";
import { createElementLayoutState, resetElementStateProvider } from "./element";
import { createIgnoreLayoutState } from "./ignore";
import { createStyleLayoutState } from "./style";
import { createTextLayoutState } from "./text";

export function createLayoutState(node: Node, info: INodeInfo): ILayoutState {
    if (info.ignore) {
        return createIgnoreLayoutState(node);
    }
    let state: ILayoutState = null;
    switch (node.nodeType) {
        case Node.DOCUMENT_TYPE_NODE:
            state = createDoctypeLayoutState(node as DocumentType);
            break;
        case Node.TEXT_NODE:
            state = createTextLayoutState(node as Text, info);
            break;
        case Node.ELEMENT_NODE:
            let elem = node as Element;
            if (elem.tagName === "STYLE") {
                state = createStyleLayoutState(elem as HTMLStyleElement, info);
            } else {
                state = createElementLayoutState(elem, info);
            }
            break;
        default:
            state = createIgnoreLayoutState(node);
            break;
    }
    return state;
}

export function resetStateProvider(): void {
    resetElementStateProvider();
}
