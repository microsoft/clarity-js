import { Constant, NodeChange, NodeInfo, NodeValue, Source } from "@clarity-types/layout";
import time from "@src/core/time";
import selector from "@src/layout/selector";

let index: number = 1;

let nodes: Node[] = [];
let values: NodeValue[] = [];
let changes: NodeChange[][] = [];
let updateMap: number[] = [];
let selectorMap: number[] = [];
let idMap: WeakMap<Node, number> = null;

export function reset(): void {
    index = 1;
    nodes = [];
    values = [];
    updateMap = [];
    changes = [];
    selectorMap = [];
    idMap = new WeakMap();
    if (Constant.DEVTOOLS_HOOK in window) { window[Constant.DEVTOOLS_HOOK] = { get, getNode, history }; }
}

export function getId(node: Node, autogen: boolean = false): number {
    if (node === null) { return null; }
    let id = idMap.get(node);
    if (!id && autogen) {
        id = index++;
        idMap.set(node, id);
    }

    return id ? id : null;
}

export function add(node: Node, data: NodeInfo, source: Source): void {
    let id = getId(node, true);
    let parentId = node.parentElement ? getId(node.parentElement) : null;
    let nextId = getNextId(node);
    let masked = true;
    let parent = null;

    if (parentId >= 0 && values[parentId]) {
        parent = values[parentId];
        parent.children.push(id);
        masked = parent.metadata.masked;
    }

    if (data.attributes && Constant.MASK_ATTRIBUTE in data.attributes) { masked = true; }
    if (data.attributes && Constant.UNMASK_ATTRIBUTE in data.attributes) { masked = false; }

    nodes[id] = node;
    values[id] = {
        id,
        parent: parentId,
        next: nextId,
        children: [],
        data,
        selector: "",
        metadata: { active: true, boxmodel: false, masked }
    };
    updateSelector(values[id]);
    layout(data.tag, id, parentId);
    track(id, source);
}

export function update(node: Node, data: NodeInfo, source: Source): void {
    let id = getId(node);
    let parentId = node.parentElement ? getId(node.parentElement) : null;
    let nextId = getNextId(node);

    if (id in values) {
        let value = values[id];
        value.metadata.active = true;

        // Handle case where internal ordering may have changed
        if (value["next"] !== nextId) {
            value["next"] = nextId;
        }

        // Handle case where parent might have been updated
        if (value["parent"] !== parentId) {
            let oldParentId = value["parent"];
            value["parent"] = parentId;
            // Move this node to the right location under new parent
            if (parentId !== null && parentId >= 0) {
                if (nextId !== null && nextId >= 0) {
                    values[parentId].children.splice(nextId + 1, 0 , id);
                } else {
                    values[parentId].children.push(id);
                }
            } else {
                // Mark this element as deleted if the parent has been updated to null
                remove(id, source);
            }

            // Remove reference to this node from the old parent
            if (oldParentId !== null && oldParentId >= 0) {
                let nodeIndex = values[oldParentId].children.indexOf(id);
                if (nodeIndex >= 0) {
                    values[oldParentId].children.splice(nodeIndex, 1);
                }
            }
        }

        // Update data
        for (let key in data) {
            if (key in value["data"]) {
                value["data"][key] = data[key];
            }
        }

        // Update selector
        updateSelector(value);

        layout(data.tag, id, parentId);
        track(id, source);
    }
}

function updateSelector(value: NodeValue): void {
    let prefix = value.parent && value.parent in values ? values[value.parent].selector : null;
    let ex = value.selector;
    let current = selector(value.data.tag, prefix, value.data.attributes);
    if (current !== ex && selectorMap.indexOf(value.id) === -1) { selectorMap.push(value.id); }
    value.selector = current;
}

export function getNode(id: number): Node {
    if (id in nodes) {
        return nodes[id];
    }
    return null;
}

export function getValue(id: number): NodeValue {
    if (id in values) {
        return values[id];
    }
    return null;
}

export function get(node: Node): NodeValue {
    let id = getId(node);
    return values[id];
}

export function has(node: Node): boolean {
    return getId(node) in nodes;
}

export function boxmodel(): NodeValue[] {
    let v = [];
    for (let id in values) {
        if (values[id].metadata.active && values[id].metadata.boxmodel) {
            v.push(values[id]);
        }
    }
    return v;
}

export function updates(): NodeValue[] {
    let output = [];
    for (let id of updateMap) {
        if (id in values) {
            let v = values[id];
            let p = v.parent;
            let hasId = "attributes" in v.data && "id" in v.data.attributes;
            v.data.path = p === null || p in updateMap || hasId || v.selector.length === 0 ? null : values[p].selector;
            output.push(values[id]);
        }
    }
    updateMap = [];
    return output;
}

export function selectors(): NodeValue[] {
    let v = [];
    for (let id of selectorMap) {
        if (id in values) {
            v.push(values[id]);
        }
    }
    selectorMap = [];
    return v;
}

function remove(id: number, source: Source): void {
    let value = values[id];
    value.metadata.active = false;
    value.parent = null;
    track(id, source);
    for (let child of value.children) { remove(child, source); }
    value.children = [];
}

function layout(tag: string, id: number, parentId: number): void {
    if (id !== null && parentId !== null) {
        switch (tag) {
            case "*T":
                // Mark parent as a leaf node only if the text node has valid text and parent is masked.
                // For nodes with whitespaces and not real text, skip them.
                if (values[parentId].metadata.masked) {
                    let value = values[id].data.value;
                    for (let i = 0; i < value.length; i++) {
                        let code = value.charCodeAt(i);
                        if (!(code === 32 || code === 10 || code === 9 || code === 13)) {
                            values[parentId].metadata.boxmodel = true;
                            break;
                        }
                    }
                }
                break;
            case "IMG":
            case "IFRAME":
                values[id].metadata.boxmodel = true;
                break;
            default:
                // Capture layout for any element with a user defined selector
                values[id].metadata.boxmodel = values[id].selector.indexOf("*") === 0;
                break;
        }
    }
}

function getNextId(node: Node): number {
    let id = null;
    while (id === null && node.nextSibling) {
        id = getId(node.nextSibling);
        node = node.nextSibling;
    }
    return id;
}

function copy(input: NodeValue[]): NodeValue[] {
    return JSON.parse(JSON.stringify(input));
}

function track(id: number, source: Source): void {
    // Keep track of the order in which mutations happened, they may not be sequential
    // Edge case: If an element is added later on, and pre-discovered element is moved as a child.
    // In that case, we need to reorder the prediscovered element in the update list to keep visualization consistent.
    let uIndex = updateMap.indexOf(id);
    if (uIndex >= 0 && source === Source.ChildListAdd) {
        updateMap.splice(uIndex, 1);
        updateMap.push(id);
    } else if (uIndex === -1) { updateMap.push(id); }

    if (Constant.DEVTOOLS_HOOK in window) {
        let value = copy([values[id]])[0];
        let change = { time: time(), source, value };
        if (!(id in changes)) { changes[id] = []; }
        changes[id].push(change);
    }
}

function history(id: number): NodeChange[] {
    if (id in changes) {
        return changes[id];
    }
    return [];
}
