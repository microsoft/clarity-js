import generateHash from "../src/data/hash";
import selector from "../src/layout/selector";
import { Event, Token } from "../types/data";
import { DomData, LayoutEvent } from "../types/decode/layout";
import { Attributes, BoxModelData, DocumentData, HashData, ResourceData, Constant } from "../types/layout";

let placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNiOAMAANUAz5n+TlUAAAAASUVORK5CYII=";
export let hashes: { [key: number]: HashData } = {};
export let resources: ResourceData[];
let lastTime: number;

export function reset(): void {
    hashes = {};
    resources = [];
    lastTime = null;
}

export function decode(tokens: Token[]): LayoutEvent {
    let time = lastTime = tokens[0] as number;
    let event = tokens[1] as Event;

    switch (event) {
        case Event.Document:
            let documentData: DocumentData = { width: tokens[2] as number, height: tokens[3] as number };
            return { time, event, data: documentData };
        case Event.BoxModel:
            let boxmodelData: BoxModelData[] = [];
            for (let i = 2; i < tokens.length; i += 3) {
                let boxmodel: BoxModelData = { id: tokens[i] as number, box: tokens[i + 1] as number[], region: tokens[i + 2] as string };
                boxmodelData.push(boxmodel);
            }
            return { time, event, data: boxmodelData };
        case Event.Discover:
        case Event.Mutation:
            let lastType = null;
            let node = [];
            let tagIndex = 0;
            let domData: DomData[] = [];
            for (let i = 2; i < tokens.length; i++) {
                let token = tokens[i];
                let type = typeof(token);
                switch (type) {
                    case "number":
                        if (type !== lastType && lastType !== null) {
                            domData.push(process(node, tagIndex));
                            node = [];
                            tagIndex = 0;
                        }
                        node.push(token);
                        tagIndex++;
                        break;
                    case "string":
                        node.push(token);
                        break;
                    case "object":
                        let subtoken = token[0];
                        let subtype = typeof(subtoken);
                        switch (subtype) {
                            case "number":
                                for (let t of (token as number[])) {
                                    node.push(tokens.length > t ? tokens[t] : null);
                                }
                                break;
                        }
                }
                lastType = type;
            }
            // Process last node
            domData.push(process(node, tagIndex));

            return { time, event, data: domData };
    }
}

export function hash(): LayoutEvent[] {
    let data = [];
    for (let id in hashes) { if (hashes[id]) { data.push(hashes[id]); } }
    return data.length > 0 ? [{ time: lastTime, event: Event.Hash, data }] : null;
}

export function resource(): LayoutEvent[] {
    return resources.length > 0 ? [{ time: lastTime, event: Event.Resource, data: resources }] : null;
}

function process(node: any[] | number[], tagIndex: number): DomData {
    let [tag, position]: string[]  = node[tagIndex] ? node[tagIndex].split("~") : [node[tagIndex]];
    let output: DomData = {
        id: node[0],
        parent: tagIndex > 1 ? node[1] : null,
        next: tagIndex > 2 ? node[2] : null,
        tag,
        position: position ? parseInt(position, 10) : null
    };
    let hasAttribute = false;
    let attributes: Attributes = {};
    let value = null;
    let prefix = output.parent in hashes ? `${hashes[output.parent].selector}>` : (output.parent ? "" : null);

    for (let i = tagIndex + 1; i < node.length; i++) {
        let token = node[i] as string;
        let keyIndex = token.indexOf("=");
        let lastChar = token[token.length - 1];
        if (i === (node.length - 1) && output.tag === "STYLE") {
            value = token;
        } else if (lastChar === ">" && keyIndex === -1) {
            prefix = token;
        } else if (output.tag !== Constant.TEXT_TAG && keyIndex > 0) {
            hasAttribute = true;
            let k = token.substr(0, keyIndex);
            let v = token.substr(keyIndex + 1);
            switch (k) {
                case "src":
                    v = v.length === 0 && output.tag === "IMG" ? placeholderImage : v;
                    break;
                default:
                    break;
            }
            attributes[k] = v;
        } else if (output.tag === Constant.TEXT_TAG) {
            value = token;
        }
    }

    let s = selector(output.tag, prefix, attributes, output.position);
    if (s.length > 0) { hashes[output.id] = { id: output.id, hash: generateHash(s), selector: s }; }

    getResource(output.tag, attributes);
    if (hasAttribute) { output.attributes = attributes; }
    if (value) { output.value = value; }

    return output;
}

function getResource(tag: string, attributes: Attributes): void {
    switch (tag) {
        case "LINK":
            if ("href" in attributes && "rel" in attributes && attributes["rel"] === "stylesheet") {
                resources.push({ tag, url: attributes["href"]});
            }
            break;
    }
}
