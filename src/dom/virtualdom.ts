import {INodeData, INodeValue } from "@clarity-types/dom";

const NODE_ID_PROP: string = "__node_index__";
let index: number = 1;

let nodes: Node[] = [];
let values: INodeValue[] = [];

let backupIndex: number;
let backupNodes: Node[];
let backupValues: Node[];

export function getId(node: Node, autogen: boolean = true): number {
    if (node === null) { return null; }
    let id = node[NODE_ID_PROP];
    if (!id && autogen) {
        id = node[NODE_ID_PROP] = index++;
    }
    return id ? id : null;
}

export function add(node: Node, data: INodeData): void {
    let id = getId(node);
    let parentId = node.parentElement ? getId(node.parentElement) : null;
    let nextId = node.nextSibling ? getId(node.nextSibling, false) : null;

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
        data
    };
}

export function update(node: Node, data: INodeData): void {
    let id = getId(node);
    console.log("Updating node: " + id);
    let parentId = node.parentElement ? getId(node.parentElement) : null;
    let nextId = node.nextSibling ? getId(node.nextSibling) : null;

    if (id in values) {
        let value = values[id];
        console.log("Previous value: " + JSON.stringify(value));

        // Handle case where internal ordering may have changed
        if (value["next"] !== nextId) {
            let oldNextId = value["next"];
            value["next"] = nextId;
            console.log("Old next id: " + oldNextId + " | " + nextId);
        }

        // Handle case where parent might have been updated
        if (value["parent"] !== parentId) {
            let oldParentId = value["parent"];
            value["parent"] = parentId;
            console.log("Old parent id: " + oldParentId + " | " + parentId);
            // Move this node to the right location under new parent
            if (parentId >= 0) {
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
    }
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
