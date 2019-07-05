export interface IAttributes {
    [key: string]: string;
}

export interface INodeData {
    tag: string;
    attributes?: IAttributes;
    layout?: number[];
    value?: string;
}

export interface INodeValue {
    id: number;
    parent: number;
    next: number;
    children: number[];
    data: INodeData;
    active?: boolean;
    update?: boolean;
}

export class NodeTree {

    private static NODE_ID_PROP: string = "__node_index__";
    private static index: number = 1;

    private nodes: Node[];
    private values: INodeValue[];

    private backupIndex: number;
    private backupNodes: Node[];
    private backupValues: Node[];

    constructor() {
        this.nodes = [];
        this.values = [];
    }

    public id(node: Node, autogen: boolean = true): number {
        if (node === null) { return null; }
        let id = node[NodeTree.NODE_ID_PROP];
        if (!id && autogen) {
            id = node[NodeTree.NODE_ID_PROP] = NodeTree.index++;
        }
        return id ? id : null;
    }

    public add(node: Node, data: INodeData): void {
        let id = this.id(node);
        let parentId = node.parentElement ? this.id(node.parentElement) : null;
        let nextId = node.nextSibling ? this.id(node.nextSibling, false) : null;

        if (parentId >= 0 && this.values[parentId]) {
            this.values[parentId].children.push(id);
        }

        this.nodes[id] = node;
        this.values[id] = {
            id,
            parent: parentId,
            next: nextId,
            children: [],
            active: true,
            update: true,
            data
        };
    }

    public update(node: Node, data: INodeData): void {
        let id = this.id(node);
        console.log("Updating node: " + id);
        let parentId = node.parentElement ? this.id(node.parentElement) : null;
        let nextId = node.nextSibling ? this.id(node.nextSibling) : null;

        if (id in this.values) {
            let value = this.values[id];
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
                        this.values[parentId].children.splice(nextId + 1, 0 , id);
                    } else {
                        this.values[parentId].children.push(id);
                    }
                } else {
                    // Mark this element as deleted if the parent has been updated to null
                    value["active"] = false;
                }

                // Remove reference to this node from the old parent
                let index = this.values[oldParentId].children.indexOf(id);
                if (index >= 0) {
                    this.values[oldParentId].children.splice(index, 1);
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

    public node(id: number): Node {
        if (id in this.nodes) {
            return this.nodes[id];
        }
        return null;
    }

    public get(node: Node): INodeValue {
        let id = this.id(node);
        return this.values[id];
    }

    public has(node: Node): boolean {
        return this.id(node) in this.nodes;
    }

    public remove(node: Node): void {
        let id = this.id(node);
        this.delete(id);
    }

    public getNodes(): Node[] {
        let nodes: Node[] = [];
        for (let id in this.nodes) {
            if (this.nodes[id]) {
                nodes.push(this.nodes[id]);
            }
        }
        return nodes;
    }

    public getValues(): INodeValue[] {
        let values = [];
        for (let id in this.values) {
            if (this.values[id] && this.values[id]["update"] === true) {
                values.push(this.values[id]);
            }
        }
        return values;
    }

    public backup(): void {
        this.backupNodes = Array.from(this.nodes);
        this.backupValues = JSON.parse(JSON.stringify(this.values));
        this.backupIndex = NodeTree.index;
    }

    public rollback(): void {
        this.nodes = Array.from(this.backupNodes);
        this.values = JSON.parse(JSON.stringify(this.backupValues));
        NodeTree.index = this.backupIndex;
    }

    private delete(id: number): void {
        let children = this.values[id].children;
        for (let i = 0; i < children.length; i++) {
            this.delete(children[i]);
        }
        this.values[id].active = false;
        this.values[id].update = true;
    }
}
