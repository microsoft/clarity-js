import { ShadowDom } from "./shadowdom";
import { createLayoutState, getElementLayoutRectangle, getNodeIndex } from "./stateprovider";

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

export function createAttributeUpdate(element: Element, previousState: IElementLayoutState, mutationSequence: number): IAttributeUpdate {
  let previousAttributes = previousState.attributes;
  let newAttributes: IAttributes = {};
  let removedAttributes: string[] = [];
  let elementAttributes = element.attributes;
  let event: IAttributeUpdate = null;
  let previousLayoutRect = previousState.layout;
  let layoutRect = getElementLayoutRectangle(element);

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

  event = {
    index: getNodeIndex(element),
    action: Action.AttributeUpdate,
    mutationSequence
  };

  if (Object.keys(newAttributes).length > 0) {
    event.new = newAttributes;
  }

  if (removedAttributes.length > 0) {
    event.removed = removedAttributes;
  }

  if (JSON.stringify(layoutRect) !== JSON.stringify(previousLayoutRect)) {
    event.layout = layoutRect;
  }

  return event;
}

export function createCharacterDataUpdate(node: CharacterDataNode, lastContent: string, mutationSequence: number): ICharacterDataUpdate {
  let content = node.textContent;
  let event: ICharacterDataUpdate = null;
  if (content !== lastContent) {
    event = {
      index: getNodeIndex(node),
      action: Action.CharacterDataUpdate,
      content,
      mutationSequence
    };
  }
  return event;
}

export function createScroll(element: Element): IScroll {
  return {
    index: getNodeIndex(element),
    action: Action.Scroll,
    scrollX: Math.round(element.scrollLeft),
    scrollY: Math.round(element.scrollTop)
  };
}

export function createInput(inputElement: InputElement): IInput {
  return {
    index: getNodeIndex(inputElement),
    action: Action.Input,
    value: inputElement.value
  };
}
