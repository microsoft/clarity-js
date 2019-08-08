import { INodeData, INodeValue, Source } from "@clarity-types/dom";
import time from "@src/core/time";

const NODE_ID_PROP: string = "__node_index__";
let index: number = 1;

let nodes: Node[] = [];
let values: INodeValue[] = [];

let backupIndex: number;
let backupNodes: Node[];
let backupValues: Node[];

// For debugging
window["DOM"] = { getId, get, getNode };

export function getId(node: Node, autogen: boolean = true): number {
    if (node === null) { return null; }
    let id = node[NODE_ID_PROP];
    if (!id && autogen) {
        id = node[NODE_ID_PROP] = index++;
    }
    return id ? id : null;
}

export function add(node: Node, data: INodeData, source: Source): void {
    let id = getId(node);
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
        active: true,
        update: true,
        track: [[time(), source]],
        data
    };
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
                if (nextId >= 0) {
                    values[parentId].children.splice(nextId + 1, 0 , id);
                } else {
                    values[parentId].children.push(id);
                }
            } else {
                // Mark this element as deleted if the parent has been updated to null
                value["active"] = false;
            }

            // Remove reference to this node from the old parent
            let nodeIndex = values[oldParentId].children.indexOf(id);
            if (nodeIndex >= 0) {
                values[oldParentId].children.splice(nodeIndex, 1);
            }
        }

        // Update data
        for (let key in data) {
            if (key in value["data"]) {
                value["data"][key] = data[key];
            }
        }

        value["update"] = true;
        value["track"].push([time(), source]);
    }
}

function getNextId(node: Node): number {
    let id = null;
    while (id === null && node.nextSibling) {
        id = getId(node.nextSibling, false);
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
    return getId(node, false) in nodes;
}

export function remove(node: Node): void {
    let id = getId(node);
    del(id);
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
    for (let id in values) {
        if (values[id].update) {
            values[id].update = false;
            v.push(values[id]);
        }
    }
    return v;
}

export function backup(): void {
    backupNodes = Array.from(nodes);
    backupValues = JSON.parse(JSON.stringify(values));
    backupIndex = index;
}

export function rollback(): void {
    nodes = Array.from(backupNodes);
    values = JSON.parse(JSON.stringify(backupValues));
    index = backupIndex;
}

function del(id: number): void {
    let children = values[id].children;
    for (let i = 0; i < children.length; i++) {
        del(children[i]);
    }
    values[id].active = false;
    values[id].update = true;
}
