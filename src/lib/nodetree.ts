interface IAttributes {
    [key: string]: string;
}

interface INodeData {
    attributes?: IAttributes;
    layout?: string;
    leaf?: boolean;
    value?: string;
}

interface INodeValue {
    parent: number;
    children: number[];
    active: boolean;
    update: boolean;
    data: INodeData;
}

export class NodeTree {

    private static NODE_ID_PROP: string = "__node_index__";
    private static index: number = 0;

    private nodes: Node[];
    private values: INodeValue[];

    private backupIndex: number;
    private backupNodes: Node[];
    private backupValues: Node[];

    constructor() {
        this.nodes = [];
        this.values = [];
    }

    public id(node: Node): number {
        if (node === null) { return null; }
        let id = node[NodeTree.NODE_ID_PROP];
        if (!id) {
            id = node[NodeTree.NODE_ID_PROP] = NodeTree.index++;
        }
        return id;
    }

    public add(parent: Node, node: Node, data: INodeData): void {
        let id = this.id(node);
        let parentId = -1;

        if (parent) {
            parentId = this.id(parent);
            if (this.values[parentId]) {
                this.values[parentId].children.push(id);
            }
        }

        this.nodes[id] = node;
        this.values[id] = {
            parent: parentId,
            children: [],
            active: true,
            update: true,
            data
        };
    }

    public update(node: Node, value: INodeValue): void {
        let id = this.id(node);
        for (let key in value) {
            if (key in this.values[id]) {
                this.values[id][key] = value[key];
            }
        }
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

    public keys(): Node[] {
        let nodes: Node[] = [];
        for (let id in this.nodes) {
            if (this.nodes[id]) {
                nodes.push(this.nodes[id]);
            }
        }
        return nodes;
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
