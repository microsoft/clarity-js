import { INodeInfo, IShadowDomMutationSummary, IShadowDomNode, NumberJson } from "@clarity-types/layout";
import { assert, isNumber, traverseNodeTree } from "@src/utils";
import { createNodeInfo } from "./nodeinfo";
import { getNodeIndex, NodeIndex } from "./stateprovider";

// Class names to tag actions that happen to nodes in a single mutation batch
const FinalClassName = "cl-final";
const NewNodeClassName = "cl-new";
const MovedNodeClassName = "cl-moved";
const UpdatedNodeClassName = "cl-updated";

export class ShadowDom {
  public shadowDocument: IShadowDomNode;

  private doc = document.implementation.createHTMLDocument("ShadowDom");
  private nextIndex = 0;
  private removedNodes = this.doc.createElement("div");
  private shadowDomRoot = this.doc.createElement("div");
  private classifyNodes = false;
  private nodeMap: { [key: number]: IShadowDomNode } = {};

  constructor() {
    this.doc.documentElement.appendChild(this.shadowDomRoot);
    this.shadowDocument = document.createElement("div") as IShadowDomNode;
  }

  public getShadowNode(index: number): IShadowDomNode {
    let node = isNumber(index) ? this.nodeMap[index] : null;
    return node;
  }

  public getNodeInfo(index: number): INodeInfo {
    let shadowNode = this.getShadowNode(index);
    return shadowNode ? shadowNode.info : null;
  }

  public insertShadowNode(node: Node, parentIndex: number, nextSiblingIndex: number): IShadowDomNode {
    let isDocument = (node === document);
    let index = this.assignNodeIndex(node);
    let parent = (isDocument ? this.shadowDomRoot : this.getShadowNode(parentIndex)) as IShadowDomNode;
    let nextSibling = this.getShadowNode(nextSiblingIndex);
    let shadowNode = this.doc.createElement("div") as IShadowDomNode;
    shadowNode.id = "" + index;
    shadowNode.node = node;
    shadowNode.computeInfo = (): INodeInfo => {
      let parentNode = shadowNode.parentNode as IShadowDomNode;
      let info = createNodeInfo(node, parentNode ? parentNode.info : null);
      shadowNode.info = info;
      return info;
    };
    this.nodeMap[index] = shadowNode;

    if (isDocument) {
      this.shadowDocument = shadowNode;
    }

    if (this.classifyNodes) {
      this.setClass(shadowNode, NewNodeClassName);
    }

    assert(!!parent, "insertShadowNode", "parent is missing");
    if (parent) {
      if (nextSibling) {
        parent.insertBefore(shadowNode, nextSibling);
      } else {
        parent.appendChild(shadowNode);
      }
    }

    return shadowNode;
  }

  public moveShadowNode(index: number, newParentIndex: number, newNextSiblingIndex: number): IShadowDomNode {
    let shadowNode = this.getShadowNode(index);
    let parent = this.getShadowNode(newParentIndex);
    let nextSibling = this.getShadowNode(newNextSiblingIndex);

    assert(!!parent, "moveShadowNode", "parent is missing");
    assert(!!shadowNode, "moveShadowNode", "shadowNode is missing");
    if (parent && shadowNode) {
      if (this.classifyNodes) {
        if (!this.hasClass(shadowNode, NewNodeClassName)) {
          this.setClass(shadowNode, MovedNodeClassName);
        }
      }

      if (nextSibling) {
        parent.insertBefore(shadowNode, nextSibling);
      } else {
        parent.appendChild(shadowNode);
      }
    }
    return shadowNode;
  }

  public updateShadowNode(index: number): void {
    let shadowNode = this.getShadowNode(index);
    if (shadowNode && this.classifyNodes) {
      this.setClass(shadowNode, UpdatedNodeClassName);
    }
  }

  public removeShadowNode(index: number): void {
    let shadowNode = this.getShadowNode(index);
    if (shadowNode) {
      this.setClass(shadowNode, MovedNodeClassName);
      this.removedNodes.appendChild(shadowNode);
    }
  }

  // As we process a batch of mutations, various things can be happening to a single node
  // In the end, however, for each affected node we will have one of the following outcomes:
  //  1. A new node was added
  //  2. Existing node was moved
  //  3. Existing node was removed
  //  4. Existing node was updated
  //  5. Existing node was moved and updated
  // Various actions on a node will lead to different finals states. Also a final state of a parent node
  // can affect and/or override the state of its children (e.g. if node A was moved to node B, but B was removed,
  // that means that A was removed as well). One of the simpler solutions to determining the final states of all
  // affected nodes and its children is 'tagging' shadow nodes with class names based on the mutations as they happen,
  // and then determining the final states of all affected nodes based on the combination of their classes (getting mutation summary).
  // Note: When we process 'remove' action on a node, instead of marking it as removed and permanently removing it from ShadowDOM
  //       and erasing its index, we actually moved it to a separate 'removedNodes' container, which is not part of the representation
  //       of the real DOM, but is still a part of the document. This way, if this node is re-inserted to the page, we can just move
  //       add it back to ShadowDOM and just record the 'Move' event, letting it maintain its index.
  public applyMutationBatch(mutations: MutationRecord[]): IShadowDomMutationSummary {
    let nextIndexBeforeProcessing = this.nextIndex;
    this.doc.documentElement.appendChild(this.removedNodes);
    this.classifyNodes = true;

    let length = mutations.length;
    for (let i = 0; i < length; i++) {
      let mutation = mutations[i];
      let target = mutation.target;
      switch (mutation.type) {
        case "attributes":
        case "characterData":
          this.applyUpdate(target, mutation.attributeName, mutation.oldValue);
          break;
        case "childList":

          // Process inserts
          // We use insertBefore to insert nodes into the shadowDom, so the right sibling needs to be inserted
          // before the left sibling. For that reason we process elements from last to first (right to left)
          let addedLength = mutation.addedNodes.length;
          for (let j = addedLength - 1; j >= 0; j--) {
            let previous = mutation.previousSibling;
            let next = mutation.nextSibling;
            if (j > 0) {
              previous = mutation.addedNodes[j - 1];
            }
            if (j < addedLength - 1) {
              next = mutation.addedNodes[j + 1];
            }
            this.applyInsert(mutation.addedNodes[j], target, previous, next, false);
          }

          // Process removes
          let removedLength = mutation.removedNodes.length;
          for (let j = 0; j < removedLength; j++) {
            this.applyRemove(mutation.removedNodes[j], target);
          }
          break;
        default:
          break;
      }
    }

    // Detach removed nodes
    this.removedNodes.parentElement.removeChild(this.removedNodes);

    // Process the new state of the ShadowDom and extract the summary
    let summary = this.getMutationSummary();

    // Clear references to removed nodes and reset shadow dom state to get it ready for the next mutation batch
    this.cleanUp();

    // Re-assign indices for all new nodes that remained attached to DOM such that there are no gaps between them
    this.reIndexNewNodes(summary.newNodes, nextIndexBeforeProcessing);

    return summary;
  }

  public hasClass(shadowNode: IShadowDomNode, className: string): boolean {
    return shadowNode ? shadowNode.classList.contains(className) : false;
  }

  public setClass(shadowNode: IShadowDomNode, className: string): void {
    if (shadowNode) {
      shadowNode.classList.add(className);
    }
  }

  public removeClass(shadowNode: IShadowDomNode, className: string): void {
    if (shadowNode) {
      shadowNode.classList.remove(className);
    }
  }

  public removeAllClasses(shadowNode: IShadowDomNode): void {
    if (shadowNode) {
      shadowNode.removeAttribute("class");
    }
  }

  // As a result of processing mutation batch, some shadow nodes that were affected by mutations have indicative class names.
  // Steps to creating a mutation summary from these nodes are the following:
  //  1. Record 'Insert' events on nodes with NewNodeClassName. We can ignore and remove other classes on such nodes, because it
  //     doesn't matter if this node was also moved around or updated - it's new, so we record its state from scratch anyways.
  //  2. Record 'Move' events on remaining nodes with MovedNodeClassName class.
  //  3. Record 'Update' events on remaining nodes with UpdatedNodeClassName class (there can be nodes that were moved AND updated).
  //  4. Inspect nodes inside the 'removedNodes' container:
  //    - Ignore nodes that have NewNodeClassName class. They are new and were not in the ShadowDom to begin with
  //    - Record a 'Remove' event for nodes that have MovedNodeClassName. They were explicitly moved and ended up in the 'removed' container
  //    - Ignore remaining nodes. Since they weren't explicitly moved, they will be auto-removed through the subtree of their removed parent
  public getMutationSummary(): IShadowDomMutationSummary {
    let summary: IShadowDomMutationSummary = {
      newNodes: [],
      movedNodes: [],
      updatedNodes: [],
      removedNodes: []
    };

    // Collect all new nodes in the top-down order
    let newNodes = Array.prototype.slice.call(this.doc.getElementsByClassName(NewNodeClassName));
    for (let i = 0; i < newNodes.length; i++) {
      let newNode = newNodes[i] as IShadowDomNode;
      summary.newNodes.push(newNode);
      this.removeAllClasses(newNode);
    }

    let moved = Array.prototype.slice.call(this.doc.getElementsByClassName(MovedNodeClassName));
    for (let i = 0; i < moved.length; i++) {
      let next = moved[i] as IShadowDomNode;
      summary.movedNodes.push(next);
      this.removeClass(next, MovedNodeClassName);
    }

    let updated = Array.prototype.slice.call(this.doc.getElementsByClassName(UpdatedNodeClassName));
    for (let i = 0; i < updated.length; i++) {
      let next = updated[i] as IShadowDomNode;
      summary.updatedNodes.push(next);
      this.removeAllClasses(next);
    }

    traverseNodeTree(this.removedNodes, (removedNode: IShadowDomNode) => {
      if (this.hasClass(removedNode, MovedNodeClassName) && !this.hasClass(removedNode, NewNodeClassName)) {
        summary.removedNodes.push(removedNode);
      }
    }, false);

    return summary;
  }

  public createIndexJson(rootNode: Node, getIndexFromNode: (node: Node) => number): NumberJson {
    let indexJson: NumberJson = [];
    this.writeIndexToJson(rootNode, indexJson, getIndexFromNode);
    return indexJson;
  }

  public isConsistent(): boolean {
    return this.isConstentSubtree(document, this.shadowDocument);
  }

  private cleanUp(): void {

    // For each removed dom node, remove its index and its shadow dom reference
    traverseNodeTree(this.removedNodes, (removedNode: IShadowDomNode) => {
      let index = getNodeIndex(removedNode.node);
      delete removedNode.node[NodeIndex];
      delete this.nodeMap[index];
    }, false);

    // Reset the state of the shadow dom to be ready for next mutation batch processing
    let finalNodes = Array.prototype.slice.call(this.doc.getElementsByClassName(FinalClassName));
    for (let i = 0; i < finalNodes.length; i++) {
      this.removeAllClasses(finalNodes[i]);
    }
    this.removedNodes.innerHTML = "";
    this.classifyNodes = false;
  }

  private writeIndexToJson(node: Node, json: NumberJson, getIndexFromNode: (node: Node) => number): void {
    let index = getIndexFromNode(node);
    let childJson: number[] = [];
    let nextChild = node.firstChild;
    json.push(index);
    if (nextChild) {
      json.push(childJson);
    }
    while (nextChild) {
      this.writeIndexToJson(nextChild, childJson, getIndexFromNode);
      nextChild = nextChild.nextSibling as IShadowDomNode;
    }
  }

  private isConsistentNode(node: Node, shadowNode: IShadowDomNode): boolean {
    let index = getNodeIndex(node);
    return (isNumber(index) && shadowNode.id === (index).toString() && shadowNode.node === node);
  }

  private isConstentSubtree(node: Node, shadowNode: IShadowDomNode): boolean {
    let isConsistent = this.isConsistentNode(node, shadowNode);
    let nextChild: Node = node.firstChild;
    let nextShadowChild: Node = shadowNode.firstChild;
    while (isConsistent) {
      if (nextChild && nextShadowChild) {
        isConsistent = this.isConstentSubtree(nextChild, nextShadowChild as IShadowDomNode);
        nextChild = nextChild.nextSibling;
        nextShadowChild = nextShadowChild.nextSibling;
      } else if (nextChild || nextShadowChild) {
        isConsistent = false;
      } else {
        break;
      }
    }
    return isConsistent;
  }

  private applyInsert(addedNode: Node, parent: Node, previousSibling: Node, nextSibling: Node, force: boolean): void {
    let addedNodeIndex = getNodeIndex(addedNode);
    let parentIndex = getNodeIndex(parent);
    let nextSiblingIndex = getNodeIndex(nextSibling);
    let validMutation = this.shouldProcessChildListMutation(addedNode, parent) || force;
    if (validMutation) {
      // If inserted node has no index, then it's a new node and we should process insert
      if (addedNodeIndex === null) {
        let shadowNode = this.insertShadowNode(addedNode, parentIndex, nextSiblingIndex);
        this.setClass(shadowNode, FinalClassName);

        // Process children
        // We use insertBefore to insert nodes into the shadowDom, so the right sibling needs to be inserted
        // before the left sibling. For that reason we process children from last to first (right to left)
        let nextChild: Node = addedNode.lastChild;
        while (nextChild) {
          this.applyInsert(nextChild, addedNode, nextChild.previousSibling, nextChild.nextSibling, true);
          nextChild = nextChild.previousSibling;
        }
      } else {
        this.moveShadowNode(addedNodeIndex, parentIndex, getNodeIndex(nextSibling));
      }
    }
  }

  private applyRemove(removedNode: Node, parent: Node): void {
    let removedNodeIndex = getNodeIndex(removedNode);
    if (removedNodeIndex !== null) {
      let validMutation = this.shouldProcessChildListMutation(removedNode, parent);
      if (validMutation) {
        this.removeShadowNode(removedNodeIndex);
      }
    }
  }

  private applyUpdate(updatedNode: Node, attrName: string, oldValue: string): void {
    let updatedNodeIndex = getNodeIndex(updatedNode);
    if (updatedNodeIndex != null) {
      this.updateShadowNode(updatedNodeIndex);
    }
  }

  // We want to determine whether we can skip this mutation without losing data. We can do so in 2 cases:
  //  1. This is a mutation for a node that is marked as 'Final'. These are the new nodes for which we already know final position,
  //     because we have discovered them by traversing other inserted node's subtree in the real page DOM. For such final nodes,
  //     we already recorded the insert action to the appropriate position, so all other mutations can be ignored.
  //  2. This is a mutation, which attempts to add or remove a node from the child list of the node, which is marked final. For such
  //     nodes, we have already processed their entire child list in the real page DOM and all children received an insert action.
  //     This means that any other mutations are either temporary (insert something that will end up being removed) or redundant, so
  //     we can skip them
  private shouldProcessChildListMutation(child: Node, parent: Node): boolean {
    let childNodeIndex = getNodeIndex(child);
    let parentIndex = getNodeIndex(parent);
    let parentShadowNode = null;
    if (childNodeIndex === null) {
      parentShadowNode = this.getShadowNode(parentIndex);
    } else {
      let childShadowNode = this.getShadowNode(childNodeIndex);
      parentShadowNode = childShadowNode && childShadowNode.parentNode;
    }
    return parentShadowNode && !this.hasClass(parentShadowNode, FinalClassName);
  }

  // When we apply a mutation batch, we assign a new index to every node that is added to the DOM as we parse mutations
  // in their natural order. However, some of those nodes end up being again removed from DOM with some follow-up mutation
  // thus 'stealing' an index with them. Since we don't instrument nodes that were added and removed within the same
  // mutation batch, we have no records of these stolen indices. To maintain consistency on the backend, at the end of the mutation,
  // we can re-assign indices for all nodes that remained attached to the DOM such that they all go in increasing order without gaps
  private reIndexNewNodes(newNodes: IShadowDomNode[], nextIndex: number): void {
    newNodes.map((shadowNode: IShadowDomNode) => {
      let index = getNodeIndex(shadowNode.node);
      delete this.nodeMap[index];
    });
    newNodes.map((shadowNode: IShadowDomNode) => {
      shadowNode.node[NodeIndex] = nextIndex;
      shadowNode.id = `${nextIndex}`;
      this.nodeMap[nextIndex] = shadowNode;
      nextIndex++;
    });
    this.nextIndex = nextIndex;
  }

  private assignNodeIndex(node: Node): number {
    let index = getNodeIndex(node);
    if (index === null) {
      index = this.nextIndex;
      this.nextIndex++;
    }
    node[NodeIndex] = index;
    return index;
  }
}
