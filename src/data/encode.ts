import {Token} from "@clarity-types/data";
import { metadata } from "@src/data/metadata";

export default function(envelope: boolean = false): Token[] {
    let tokens = [];
    tokens.push(metadata.sequence);
    tokens.push(metadata.version);
    tokens.push(metadata.pageId);
    tokens.push(metadata.userId);
    tokens.push(metadata.projectId);
    if (envelope === false) {
        tokens.push(metadata.url);
        tokens.push(metadata.title);
    }
    return tokens;
}
