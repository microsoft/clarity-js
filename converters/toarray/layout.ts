export function insertToArray(insert: IInsert) {
  let data = mutationToArray(insert);
  data.push(layoutStateToArray(insert.state));
  return data;
}

export function removeToArray(remove: IRemove) {
  let data = mutationToArray(remove);
  return data;
}

export function moveToArray(move: IMove) {
  let data = mutationToArray(move);
  data = data.concat([move.parent, move.previous, move.next]);
  return data;
}

export function attributeUpdateToArray(update: IAttributeUpdate) {
  let data = mutationToArray(update);
  data.push(update.new === undefined ? null : update.new);
  data.push(update.removed === undefined ? null : update.removed);
  data.push(update.layout === undefined ? null : update.layout);
  return data;
}

export function cdataUpdateToArray(update: ICharacterDataUpdate) {
  let data = mutationToArray(update);
  data.push(update.content);
  return data;
}

export function mutationToArray(mutation: IMutation) {
  let data = layoutDataToArray(mutation);
  data.push(mutation.mutationSequence);
  return data;
}

export function scrollToArray(scroll: IScroll) {
  let data = layoutDataToArray(scroll);
  data.push(scrollX);
  data.push(scrollY);
  return data;
}

export function inputToArray(input: IInput) {
  let data = layoutDataToArray(input);
  data.push(input.value);
  return data;
}

export function layoutRectangleToArray(layout: ILayoutRectangle): number[] {
  let data = [layout.x, layout.y, layout.width, layout.height];
  if ("scrollX" && "scrollY" in layout) {
    data.push(layout.scrollX);
    data.push(layout.scrollY);
  }
  return data;
}

export function layoutStateToArray(state: ILayoutState): any[] {
  let base = layoutStateBaseToArray(state);
  let extras: any[] = [];
  switch (state.tag) {
    case "*DOC*":
      extras = doctypeStateToArray(state as IDoctypeLayoutState);
      break;
    case "*TXT*":
      extras = textStateToArray(state as ITextLayoutState);
      break;
    case "*IGNORE*":
      extras = ignoreStateToArray(state as IIgnoreLayoutState);
      break;
    default:
      extras = elementStateToArray(state as IElementLayoutState);
      break;
  }
  return base.concat(extras);
}

function layoutStateBaseToArray(state: ILayoutState): any[] {
  let data = [
    state.index,
    state.parent,
    state.previous,
    state.next,
    state.tag
  ];
  return data;
}

function doctypeStateToArray(state: IDoctypeLayoutState): any[]  {
  return [state.attributes];
}

function textStateToArray(state: ITextLayoutState): any[]  {
  return [state.content];
}

function ignoreStateToArray(state: IIgnoreLayoutState): any[] {
  let elementTag = state.elementTag || null;
  return [state.nodeType, elementTag];
}

function elementStateToArray(state: IElementLayoutState): any[]  {
  let rectangle = layoutRectangleToArray(state.layout);
  return [state.attributes, rectangle];
}

function layoutDataToArray(layoutData: ILayoutEventData): any[] {
  let data = [
    layoutData.index,
    layoutData.action,
    layoutData.time === undefined ? null : layoutData.time
  ];
  return data;
}
