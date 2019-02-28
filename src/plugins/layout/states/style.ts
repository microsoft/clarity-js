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
        // If 'cssRules' is set to true, capture rules on all style nodes.
        // Otherwise, optimistically hope that rules match the textContent,
        // except for the case when there is no inner text. 'Empty' <style>
        // node is a rather common way to add styles to the page by using
        // <style>.insertRule API instead of appending css text children.
        // (e.g. styled-components library; https://www.npmjs.com/package/styled-components)
        captureCssRules = config.cssRules || node.textContent.length === 0;
    }
    return captureCssRules;
}
