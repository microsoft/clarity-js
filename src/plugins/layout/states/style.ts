import { INodeInfo, IStyleLayoutState } from "@clarity-types/layout";
import { config } from "@src/config";
import { createElementLayoutState } from "./element";

export function createStyleLayoutState(styleNode: HTMLStyleElement, info: INodeInfo): IStyleLayoutState {
    let layoutState = createElementLayoutState(styleNode, info) as IStyleLayoutState;
    if (info.captureCssRules) {
        layoutState.cssRules = getCssRules(styleNode);
    }
    return layoutState;
}

export function getCssRules(element: HTMLStyleElement): string[] {
    let cssRules = null;
    let rules = [];
    // Firefox throws a SecurityError when trying to access cssRules of a stylesheet from a different domain
    try {
        let sheet = element.sheet as CSSStyleSheet;
        cssRules = sheet ? sheet.cssRules : [];
    } catch (e) {
        if (e.name !== "SecurityError") {
            throw e;
        }
    }

    if (cssRules !== null) {
        rules = [];
        for (let i = 0; i < cssRules.length; i++) {
            rules.push(cssRules[i].cssText);
        }
    }

    return rules;
}

export function shouldCaptureCssRules(node: Node): boolean {
    let captureCssRules = false;
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "STYLE") {
        // Capturing CSS rules associated with a style node is more precise than relying on its childlist CSS text,
        // because rules can be added/modified without affecting child text nodes, but it is also costly for performance.
        // As a compromise, we are going to capture CSS rules in two cases:
        // 1. If the config explicitly tells us to do so
        // 2. If style node has no children. A rather common technique is to control page styles by inserting rules
        // directly into the 'sheet holder' style node. So, when we encounter a style node with no inner text,
        // chances are high that there are non-child-text rules associated with it and if we don't capture them,
        // page visualization is likely to be broken. An popular example library that uses such technique is 'styled-components'.
        // https://www.npmjs.com/package/styled-components
        captureCssRules = config.cssRules || node.textContent.length === 0;
    }
    return captureCssRules;
}
