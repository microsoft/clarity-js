import {Token} from "@clarity-types/data";
import { metadata } from "@src/data/metadata";

export default function(): Token[] {
    let tokens = [];
    tokens.push(metadata.version);
    tokens.push(metadata.pageId);
    tokens.push(metadata.userId);
    tokens.push(metadata.siteId);
    tokens.push(metadata.url);
    tokens.push(metadata.title);
    return tokens;
}
