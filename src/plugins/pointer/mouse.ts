import { IPointerState } from "../../../clarity";
import { NodeIndex } from "../layout/stateprovider";

export function transform(evt: MouseEvent): IPointerState[] {
  let de = document.documentElement;
  return [{
    index: 1, /* Pointer ID */
    event: evt.type,
    pointer: "mouse",
    x: "pageX" in evt ? evt.pageX : ("clientX" in evt ? evt["clientX"] + de.scrollLeft : null),
    y: "pageY" in evt ? evt.pageY : ("clientY" in evt ? evt["clientY"] + de.scrollTop : null),
    width: 1,
    height: 1,
    pressure: 1,
    tiltX: 0,
    tiltY: 0,
    target: (evt.target && NodeIndex in evt.target) ? evt.target[NodeIndex] : null,
    buttons: evt.buttons
  }];
}
