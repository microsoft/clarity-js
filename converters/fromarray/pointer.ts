export default function(pointerData: any[]): IPointerEventData {
  let data: IPointerEventData = {
    state: pointerStateFromArray(pointerData)
  };
  return data;
}

function pointerStateFromArray(pointerState: any[]): IPointerState {
  let state: IPointerState = {
    index: pointerState[0],
    type: pointerState[1],
    pointer: pointerState[2],
    x: pointerState[3],
    y: pointerState[4],
    width: pointerState[5],
    height: pointerState[6],
    pressure: pointerState[7],
    tiltX: pointerState[8],
    tiltY: pointerState[9],
    target: pointerState[10],
    buttons: pointerState[11]
  };
  return state;
}
