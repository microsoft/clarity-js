import { Attributes, Constant } from "../../types/layout";

export default function(tag: string, prefix: string, attributes: Attributes, position: number): string {
    let empty = "";
    let suffix = position ? `:nth-of-type(${position})` : empty;
    switch (tag) {
        case "STYLE":
        case "TITLE":
        case "LINK":
        case "META":
        case "*T":
        case "*D":
            return empty;
        case "HTML":
            return "HTML";
        default:
            if (prefix === null) { return empty; }
            tag = tag.indexOf(Constant.SVG_PREFIX) === 0 ? tag.substr(Constant.SVG_PREFIX.length) : tag;
            let selector = `${prefix}${tag}${suffix}`;
            if (Constant.ID_ATTRIBUTE in attributes) {
                selector = `*${attributes[Constant.ID_ATTRIBUTE]}`;
            } else if ("id" in attributes && attributes["id"].length > 0) {
                selector = `${tag}#${attributes.id}`;
            } else if ("class" in attributes && attributes["class"].length > 0) {
                selector = `${prefix}${tag}.${attributes.class.trim().split(/\s+/).join(".")}${suffix}`;
            }
            return selector;
    }
}
