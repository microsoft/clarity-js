import { Event } from "@clarity-types/data";
import { IDocumentSize } from "@clarity-types/layout";
import encode from "./encode";

export let doc: IDocumentSize;

export function compute(): void {
    let body = document.body;
    let d = document.documentElement;
    let bodyClientHeight = body ? body.clientHeight : null;
    let bodyScrollHeight = body ? body.scrollHeight : null;
    let bodyOffsetHeight = body ? body.offsetHeight : null;
    let documentClientHeight = d ? d.clientHeight : null;
    let documentScrollHeight = d ? d.scrollHeight : null;
    let documentOffsetHeight = d ? d.offsetHeight : null;
    let documentHeight = Math.max(bodyClientHeight, bodyScrollHeight, bodyOffsetHeight,
    documentClientHeight, documentScrollHeight, documentOffsetHeight);

    doc = {
        width: body ? body.clientWidth : null,
        height: documentHeight
    };

    encode(Event.Document);
}
