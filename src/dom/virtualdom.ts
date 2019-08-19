import { INodeChange, INodeData, INodeValue, Source } from "@clarity-types/dom";
import time from "@src/core/time";

const NODE_ID_PROP: string = "__node_index__";
let index: number = 1;

let nodes: Node[] = [];
let values: INodeValue[] = [];
let updates: number[] = [];
let changes: INodeChange[][] = [];

let backupIndex: number;
let backupNodes: Node[];
let backupValues: INodeValue[];

// For debugging
window["DOM"] = { getId, get, getNode, changes };

export function reset(): void {
    index = 1;
    nodes = [];
    values = [];
    updates = [];
    changes = [];
    console.log("Window Random: " + window["RANDOM"]);
}

export function getId(node: Node, autogen: boolean = false): number {
    if (node === null) { return null; }
    let id = node[NODE_ID_PROP];
    if (!id && autogen) {
        id = node[NODE_ID_PROP] = index++;
    }
    return id ? id : null;
}

export function add(node: Node, data: INodeData, source: Source): void {
    let id = getId(node, true);
    let parentId = node.parentElement ? getId(node.parentElement) : null;
    let nextId = getNextId(node);

    if (parentId >= 0 && values[parentId]) {
        values[parentId].children.push(id);
    }

    nodes[id] = node;
    values[id] = {
        id,
        parent: parentId,
        next: nextId,
        children: [],
        data
    };
    track(id, source);
}

export function update(node: Node, data: INodeData, source: Source): void {
    let id = getId(node);
    let parentId = node.parentElement ? getId(node.parentElement) : null;
    let nextId = getNextId(node);

    if (id in values) {
        let value = values[id];

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
                value["active"] = false;
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
        track(id, source);
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

export function getNode(id: number): Node {
    if (id in nodes) {
        return nodes[id];
    }
    return null;
}

export function get(node: Node): INodeValue {
    let id = getId(node);
    return values[id];
}

export function has(node: Node): boolean {
    return getId(node) in nodes;
}

export function getNodes(): Node[] {
    let n: Node[] = [];
    for (let id in nodes) {
        if (nodes[id]) {
            n.push(nodes[id]);
        }
    }
    return n;
}

export function summarize(): INodeValue[] {
    let v = [];
    for (let id of updates) {
        if (id in values) {
            v.push(values[id]);
        }
    }
    updates = [];
    return v;
}

export function backup(): void {
    backupNodes = Array.from(nodes);
    backupValues = copy(values);
    backupIndex = index;
}

export function rollback(): void {
    nodes = Array.from(backupNodes);
    values = copy(backupValues);
    index = backupIndex;
}

function copy(input: INodeValue[]): INodeValue[] {
    return JSON.parse(JSON.stringify(input));
}

function track(id: number, source: Source): void {
    if (updates.indexOf(id) === -1) { updates.push(id); }
    let value = copy([values[id]])[0];
    let change = { time: time(), source, value };
    if (!(id in changes)) { changes[id] = []; }
    changes[id].push(change);
}
