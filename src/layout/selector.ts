import { Attributes, Constant } from "../../types/layout";

export default function(tag: string, prefix: string, attributes: Attributes): string {
    let empty = "";
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
            let s = "id" in attributes && attributes["id"].length > 0 ? `${tag}#${attributes.id}` : `${prefix}${tag}`;
            if ("class" in attributes && attributes["class"].length > 0) { s = `${s}.${attributes.class.trim().split(/\s+/).join(".")}`; }
            if (Constant.ID_ATTRIBUTE in attributes) { s = `*${attributes[Constant.ID_ATTRIBUTE]}`; }
            return s;
    }
}
