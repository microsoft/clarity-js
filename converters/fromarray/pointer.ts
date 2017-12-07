let pointerConverters = [];
pointerConverters[PointerEventType.Pointer] = pointerFromArray;

export default pointerConverters;

function pointerFromArray(pointerState: any[]): IPointerEventData {
  let state: IPointerEventData = {
    index     : pointerState[0],
    type      : pointerState[1],
    pointer   : pointerState[2],
    x         : pointerState[3],
    y         : pointerState[4],
    width     : pointerState[5],
    height    : pointerState[6],
    pressure  : pointerState[7],
    tiltX     : pointerState[8],
    tiltY     : pointerState[9],
    target    : pointerState[10],
    buttons   : pointerState[11]
  };
  return state;
}
