let pointerConverters = [];
pointerConverters[PointerEventType.Pointer] = pointerToArray;

export default pointerConverters;

function pointerToArray(pointerState: IPointerState) {
  let data = [
    pointerState.index,
    pointerState.type,
    pointerState.pointer,
    pointerState.x,
    pointerState.y,
    pointerState.width,
    pointerState.height,
    pointerState.pressure,
    pointerState.tiltX,
    pointerState.tiltY,
    pointerState.target,
    pointerState.buttons
  ];
  return data;
}
