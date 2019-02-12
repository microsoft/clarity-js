import { Action, ICssRuleState } from "@clarity-types/layout";
import { addEvent } from "@src/core";
import { NodeIndex } from "./stateprovider";

const ClarityIndex: string = "cl-index";
let nextRuleId: number;

export function discoverCss(): void {
    const docSheets = document.styleSheets;
    for (let i = 0; i < docSheets.length; i++) {
        if (docSheets[i] instanceof CSSStyleSheet) {
            const cssSheet = docSheets[i] as CSSStyleSheet;
            const sheetOwnerNodeIndex = cssSheet.ownerNode[NodeIndex];
            const cssRules = cssSheet.cssRules;
            for (let j = 0; j < cssRules.length; j++) {
                addRule(cssRules[j], sheetOwnerNodeIndex, j);
            }
        }
    }
}

export function resetCss(): void {
    nextRuleId = 0;
}

export function addRule(rule: CSSRule, sheetOwnerNodeIndex: number, insertIndex: number): void {
    if (!sheetOwnerNodeIndex && sheetOwnerNodeIndex !== 0) {
        return;
    }

    const id = `rule_${nextRuleId++}`;
    const eventState: ICssRuleState = {
        index: -1,
        tag: "*CSS*",
        source: -1,
        action: Action.Insert,
        parent: null,
        previous: null,
        next: null,
        sheetOwnerIndex: sheetOwnerNodeIndex,
        ruleId: id,
        css: rule.cssText,
        insertIndex
    };
    rule[ClarityIndex] = id;
    addEvent({
        type: "Layout",
        state: eventState
    });
}
