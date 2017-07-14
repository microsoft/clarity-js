import { assert, isNumber, traverseNodeTree } from "../../utils";
import { getNodeIndex, IgnoreTag, NodeIndex } from "./stateprovider";

// Class names for child list mutation classifications
const FinalClassName = "cl-final";
const NewNodeClassName = "cl-new";
const MovedNodeClassName = "cl-moved";
const UpdatedNodeClassName = "cl-updated";

export class ShadowDom {
  public doc = document.implementation.createHTMLDocument("ShadowDom");

  private nextIndex = 0;
  private removedNodes = this.doc.createElement("div");
  private shadowDomRoot = this.doc.createElement("div");
  private shadowDocument: IShadowDomNode = null;
  private classifyNodes = false;

  constructor() {
    this.doc.documentElement.appendChild(this.shadowDomRoot);
  }

  public getShadowNode(index: number): IShadowDomNode {
    let node = isNumber(index) ? this.doc.getElementById("" + index) : null;
    return node as IShadowDomNode;
  }

  public insertShadowNode(node: Node, parentIndex: number, nextSiblingIndex: number, ignore?: boolean): IShadowDomNode {
    let isDocument = (node === document);
    let index = this.setNodeIndex(node);
    let parent = (isDocument ? this.shadowDomRoot : this.getShadowNode(parentIndex)) as IShadowDomNode;
    let nextSibling = this.getShadowNode(nextSiblingIndex);
    let shadowNode = this.doc.createElement("div") as IShadowDomNode;
    shadowNode.id = "" + index;
    shadowNode.node = node;
    shadowNode.ignore = ignore || (node === document ? false : parent && parent.ignore);

    if (isDocument) {
      this.shadowDocument = shadowNode;
    }

    assert(!!parent, "insertShadowNode", "parent is missing");
    if (parent) {
      if (this.classifyNodes) {
        this.setClass(shadowNode, NewNodeClassName);
      }

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

  public updateShadowNode(index: number) {
    let shadowNode = this.getShadowNode(index);
    if (shadowNode && this.classifyNodes) {
      this.setClass(shadowNode, UpdatedNodeClassName);
    }
  }

  public removeShadowNode(index: number) {
    let shadowNode = this.getShadowNode(index);
    if (shadowNode) {
      this.setClass(shadowNode, MovedNodeClassName);
      this.removedNodes.appendChild(shadowNode);
    }
  }

  public applyMutationBatch(mutations: MutationRecord[]): IShadowDomMutationSummary {
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

    // Clean up the state to be ready for next mutation batch processing
    let finalNodes = this.doc.getElementsByClassName(FinalClassName);
    while (finalNodes.length > 0) {
      this.removeClass(finalNodes[0] as IShadowDomNode, FinalClassName);
    }
    this.removedNodes.innerHTML = "";
    this.classifyNodes = false;

    return summary;
  }

  public hasClass(shadowNode: IShadowDomNode, className: string) {
    return shadowNode ? shadowNode.classList.contains(className) : false;
  }

  public setClass(shadowNode: IShadowDomNode, className: string) {
    if (shadowNode) {
      shadowNode.classList.add(className);
    }
  }

  public removeClass(shadowNode: IShadowDomNode, className: string) {
    if (shadowNode) {
      shadowNode.classList.remove(className);
    }
  }

  public removeAllClasses(shadowNode: IShadowDomNode) {
    if (shadowNode) {
      shadowNode.removeAttribute("class");
    }
  }

  public getMutationSummary(): IShadowDomMutationSummary {
    let summary: IShadowDomMutationSummary = {
      newNodes: [],
      movedNodes: [],
      updatedNodes: [],
      removedNodes: []
    };

    // Collect all new nodes in the top-down order
    let newNodes = this.doc.getElementsByClassName(NewNodeClassName);
    while (newNodes.length > 0) {
      let newNode = newNodes[0] as IShadowDomNode;
      summary.newNodes.push(newNode);
      this.removeClass(newNode, NewNodeClassName);
    }

    let moved = this.doc.getElementsByClassName(MovedNodeClassName);
    while (moved.length > 0) {
      let next = moved[0] as IShadowDomNode;
      summary.movedNodes.push(next);
      this.removeAllClasses(next);
    }

    let updated = this.doc.getElementsByClassName(UpdatedNodeClassName);
    while (updated.length > 0) {
      let next = updated[0] as IShadowDomNode;
      summary.updatedNodes.push(next);
      this.removeAllClasses(next);
    }

    let removedNodes = this.removedNodes.childNodes;
    for (let i = 0; i < removedNodes.length; i++) {
      traverseNodeTree(removedNodes[i], (shadowNode: IShadowDomNode) => {
        if (this.hasClass(shadowNode, NewNodeClassName)) {
          delete shadowNode.node[NodeIndex];
        } else if (this.hasClass(shadowNode, MovedNodeClassName)) {
          summary.removedNodes.push(shadowNode);
        }
      });
    }

    return summary;
  }

  public createDomIndexJson(): object {

    function writeIndex(node: Node, json: object) {
      let index = getNodeIndex(node);
      let childJson = {};
      let nextChild = node.firstChild;
      json[index] = nextChild ? childJson : null;
      while (nextChild) {
        writeIndex(nextChild, childJson);
        nextChild = nextChild.nextSibling;
      }
    }

    let indexJson = {};
    writeIndex(document, indexJson);

    return indexJson;
  }

  public createShadowDomIndexJson(): object {

    function writeIndex(shadowNode: IShadowDomNode, json: object) {
      let index = shadowNode.id;
      let childJson = {};
      let nextChild = shadowNode.firstChild as IShadowDomNode;
      json[index] = nextChild ? childJson : null;
      while (nextChild) {
        writeIndex(nextChild, childJson);
        nextChild = nextChild.nextSibling as IShadowDomNode;
      }
    }

    let indexJson = {};
    writeIndex(this.shadowDocument, indexJson);

    return indexJson;
  }

  public isConsistent(): boolean {
    return this.validateNodeWithSubtree(document, this.shadowDocument);
  }

  private validateShadow(node: Node, shadowNode: IShadowDomNode) {
    let index = getNodeIndex(node);
    return (isNumber(index) && shadowNode.id === (index).toString() && shadowNode.node === node);
  }

  private validateNodeWithSubtree(node: Node, shadowNode: IShadowDomNode): boolean {
    let isConsistent = this.validateShadow(node, shadowNode);
    let nextChild = node.firstChild;
    let nextShadowChild = shadowNode.firstChild;
    while (isConsistent) {
      if (nextChild && nextShadowChild) {
        isConsistent = this.validateNodeWithSubtree(nextChild, nextShadowChild as IShadowDomNode);
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

  private applyInsert(addedNode: Node, parent: Node, previousSibling: Node, nextSibling: Node, force: boolean) {
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
        let nextChild = addedNode.lastChild;
        while (nextChild) {
          this.applyInsert(nextChild, addedNode, nextChild.previousSibling, nextChild.nextSibling, true);
          nextChild = nextChild.previousSibling;
        }
      } else {
        this.moveShadowNode(addedNodeIndex, parentIndex, getNodeIndex(nextSibling));
      }
    }
  }

  private applyRemove(removedNode: Node, parent: Node) {
    let removedNodeIndex = getNodeIndex(removedNode);
    if (removedNodeIndex !== null) {
      let validMutation = this.shouldProcessChildListMutation(removedNode, parent);
      if (validMutation) {
        this.removeShadowNode(removedNodeIndex);
      }
    }
  }

  private applyUpdate(updatedNode: Node, attrName: string, oldValue: string) {
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
  private shouldProcessChildListMutation(child: Node, parent: Node) {
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

  private setNodeIndex(node: Node): number {
    let index = getNodeIndex(node);
    if (index === null) {
      index = this.nextIndex;
      this.nextIndex++;
    }
    node[NodeIndex] = index;
    return index;
  }
}
