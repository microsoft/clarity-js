export default function(layoutData: any[]): ILayoutEventData {
  let data = layoutDataFromArray(layoutData);
  switch (data.action) {
    case Action.Insert:
      data = insertFromArray(layoutData);
      break;
    case Action.Remove:
      data = removeFromArray(layoutData);
      break;
    case Action.Move:
      data = moveFromArray(layoutData);
      break;
    case Action.AttributeUpdate:
      data = attributeUpdateFromArray(layoutData);
      break;
    case Action.CharacterDataUpdate:
      data = cdataUpdateFromArray(layoutData);
      break;
    case Action.Scroll:
      data = scrollFromArray(layoutData);
      break;
    case Action.Input:
      data = inputFromArray(layoutData);
      break;
    default:
      console.warn("Unknown layout action: " + data.action);
      break;
  }
  return data;
}

export function layoutStateFromArray(state: any[]): ILayoutState {
  let data: ILayoutState = null;
  let tag = state[4];
  switch (tag) {
    case "*DOC*":
      data = doctypeStateFromArray(state);
      break;
    case "*TXT*":
      data = textStateFromArray(state);
      break;
    case "*IGNORE*":
      data = ignoreStateFromArray(state);
      break;
    default:
      data = elementStateFromArray(state);
      break;
  }
  return data;
}

export function attributeUpdateFromArray(update: any[]): IAttributeUpdate {
  let data = mutationFromArray(update) as IAttributeUpdate;
  if (update[4] !== null) {
    data.new = update[4];
  }
  if (update[5] !== null) {
    data.removed = update[5];
  }
  if (update[6] !== null) {
    data.layout = update[6];
  }
  return data;
}

function insertFromArray(insert: any[]): IInsert {
  let data = mutationFromArray(insert) as IInsert;
  data.state = layoutStateFromArray(insert[4]);
  return data;
}

function removeFromArray(remove: any[]): IRemove {
  let data = mutationFromArray(remove) as IRemove;
  return data;
}

function moveFromArray(move: any[]): IMove {
  let data = mutationFromArray(move) as IMove;
  data.parent = move[4];
  data.previous = move[5];
  data.next = move[6];
  return data;
}

function cdataUpdateFromArray(update: any[]): ICharacterDataUpdate {
  let data = mutationFromArray(update) as ICharacterDataUpdate;
  data.content = update[4];
  return data;
}

function mutationFromArray(mutation: any[]): IMutation {
  let data = layoutDataFromArray(mutation) as IMutation;
  data.mutationSequence = mutation[3];
  return data;
}

function scrollFromArray(scroll: any[]): IScroll {
  let data = layoutDataFromArray(scroll) as IScroll;
  data.scrollX = scroll[3];
  data.scrollY = scroll[4];
  return data;
}

function inputFromArray(input: any[]): IInput {
  let data = layoutDataFromArray(input) as IInput;
  data.value = input[3];
  return data;
}

function layoutRectangleFromArray(layout: any[]): ILayoutRectangle {
  let data: ILayoutRectangle = {
    x: layout[0],
    y: layout[1],
    width: layout[2],
    height: layout[3]
  };
  if (layout[4] !== undefined) {
    data.scrollX = layout[4];
  }
  if (layout[5] !== undefined) {
    data.scrollY = layout[5];
  }
  return data;
}

function layoutStateBaseFromArray(state: any[]): ILayoutState {
  let data: ILayoutState = {
    index     : state[0],
    parent    : state[1],
    previous  : state[2],
    next      : state[3],
    tag       : state[4]
  };
  return data;
}

function doctypeStateFromArray(state: any[]): IDoctypeLayoutState  {
  let data = layoutStateBaseFromArray(state) as IDoctypeLayoutState;
  data.attributes = state[5];
  return data;
}

function textStateFromArray(state: any[]): ITextLayoutState  {
  let data = layoutStateBaseFromArray(state) as ITextLayoutState;
  data.content = state[5];
  return data;
}

function ignoreStateFromArray(state: any[]): IIgnoreLayoutState {
  let data = layoutStateBaseFromArray(state) as IIgnoreLayoutState;
  data.nodeType = state[5];
  data.elementTag = state[6];
  return data;
}

function elementStateFromArray(state: any[]): IElementLayoutState  {
  let data = layoutStateBaseFromArray(state) as IElementLayoutState;
  let layout = layoutRectangleFromArray(state[6]);
  data.attributes = state[5];
  data.layout = layout;
  return data;
}

function layoutDataFromArray(layoutData: any[]): ILayoutEventData {
  let data: ILayoutEventData = {
    index: layoutData[0],
    action: layoutData[1]
  };
  if (layoutData[2] !== null) {
    data.time = layoutData[2];
  }
  return data;
}
