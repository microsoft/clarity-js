import { NodeIndex } from "@src/plugins/layout/stateprovider";
import { IPointerState } from "../../../types/pointer";

// Accessing any evt property can sometimes (rarely) throw exception "Permission denied to access property..."
// Not adding try/catch by design for perf reasons
export function transform(evt: TouchEvent): IPointerState[] {
  let states: IPointerState[] = [];
  let de = document.documentElement;
  let buttons = (evt.type === "touchstart" || evt.type === "touchmove") ? 1 : 0;
  let touches = evt.changedTouches || [];
  for (let i = 0; i < touches.length; i++) {
    let touch = touches[i];
    states.push({
      index: touch.identifier + 2, /* Avoid conflict with mouse index of 1 */
      event: evt.type,
      pointer: "touch",
      x: "clientX" in touch ? touch.clientX + de.scrollLeft : null,
      y: "clientY" in touch ? touch.clientY + de.scrollTop : null,
      width: "radiusX" in touch ? touch["radiusX"] : ("webkitRadiusX" in touch ? touch["webkitRadiusX"] : 0),
      height: "radiusY" in touch ? touch["radiusY"] : ("webkitRadiusY" in touch ? touch["webkitRadiusY"] : 0),
      pressure: "force" in touch ? touch["force"] : ("webkitForce" in touch ? touch["webkitForce"] : 0.5),
      tiltX: 0,
      tiltY: 0,
      target: (evt.target && NodeIndex in evt.target) ? evt.target[NodeIndex] : null,
      buttons
    });
  }
  return states;
}
