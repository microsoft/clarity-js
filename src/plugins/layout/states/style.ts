import { IStyleLayoutState } from "@clarity-types/layout";
import { createElementLayoutState } from "./element";

export function createStyleLayoutState(styleNode: HTMLStyleElement): IStyleLayoutState {
    let layoutState = createElementLayoutState(styleNode) as IStyleLayoutState;
    if (styleNode.textContent.length === 0) {
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
