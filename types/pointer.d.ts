import { IEvent } from "./core";

export interface IPointerEvent extends IEvent {
  state: IPointerState;
}

export interface IPointerModule {
  transform(evt: Event): IPointerState[];
}

/* Spec: https://www.w3.org/TR/pointerevents/#pointerevent-export interface */
export interface IPointerState {
  index: number; /* Pointer ID */
  event: string; /* Original event that is mapped to pointer event */
  pointer: string; /* pointerType: mouse, pen, touch */
  x: number; /* X-Axis */
  y: number; /* Y-Axis */
  width: number;
  height: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  target: number; /* Layout index of the target element */
  buttons: number;
  targetX?: number;
  targetY?: number;
}
