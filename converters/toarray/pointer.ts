export default function(pointerData: IPointerEventData) {
  return pointerStateToArray(pointerData.state);
}

function pointerStateToArray(pointerState: IPointerState) {
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
