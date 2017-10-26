import { ShadowDom } from "./shadowdom";
import { createLayoutState, getNodeIndex } from "./stateprovider";

export function createInsert(node: Node, shadowDom: ShadowDom, mutationSequence: number): IInsert {
  return {
    index: getNodeIndex(node),
    action: Action.Insert,
    state: createLayoutState(node, shadowDom),
    mutationSequence
  };
}

export function createRemove(index: number, mutationSequence: number): IRemove {
  return {
    index,
    action: Action.Remove,
    mutationSequence
  };
}

export function createMove(node: Node, mutationSequence: number): IMove {
  return {
    index: getNodeIndex(node),
    action: Action.Move,
    parent: getNodeIndex(node.parentNode),
    previous: getNodeIndex(node.previousSibling),
    next: getNodeIndex(node.nextSibling),
    mutationSequence
  };
}

export function createAttributeUpdate(element: Element, previousAttributes: IAttributes, mutationSequence: number): IAttributeUpdate {
  let newAttributes: IAttributes = {};
  let removedAttributes: string[] = [];
  let elementAttributes = element.attributes;
  let event: IAttributeUpdate = null;

  // Check new attributes for new and updated values
  for (let i = 0; i < elementAttributes.length; i++) {
    let name = elementAttributes[i].name;
    let value = elementAttributes[i].value;
    if (name in previousAttributes && previousAttributes[name] === value) {
      // No change in this attribute - move on
    } else {
      newAttributes[name] = value;
    }
  }

  let prevKeys = Object.keys(previousAttributes);
  for (let i = 0; i < prevKeys.length; i++) {
    let name = prevKeys[i];
    let value = previousAttributes[name];
    if (!(name in elementAttributes)) {
      removedAttributes.push(name);
    }
  }

  if (Object.keys(newAttributes).length > 0 || removedAttributes.length > 0) {
    event = {
      index: getNodeIndex(element),
      action: Action.AttributeUpdate,
      new: newAttributes,
      removed: removedAttributes,
      mutationSequence
    };
  }

  return event;
}

export function createCharacterDataUpdate(node: CharacterDataNode, lastContent: string, mutationSequence: number): ICharacterDataUpdate {
  let content = node.textContent;
  let event: ICharacterDataUpdate = null;
  if (content !== lastContent) {
    event = {
      index: getNodeIndex(node),
      action: Action.AttributeUpdate,
      content,
      mutationSequence
    };
  }
  return event;
}

export function createScroll(element: Element): IScroll {
  return {
    index: getNodeIndex(element),
    action: Action.Scroll
  };
}

export function createInput(textarea: InputElement): IInput {
  return {
    index: getNodeIndex(textarea),
    action: Action.Input,
    value: textarea.value
  };
}
