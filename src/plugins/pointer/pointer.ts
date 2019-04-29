import * as mouse from "./mouse";
import * as touch from "./touch";

import { IPlugin } from "@clarity-types/core";
import { IPointerModule, IPointerState } from "@clarity-types/pointer";
import { config } from "@src/config";
import { addEvent, bind } from "@src/core";
import { getBoundingClientRect } from "@src/utils";

export default class Pointer implements IPlugin {
  private eventName: string = "Pointer";
  private distanceThreshold: number = 20;
  private timeThreshold: number = 500;
  private lastMoveState: IPointerState;
  private lastMoveTime: number;

  public activate(): void {
    bind(document, "mousedown", this.pointerHandler.bind(this, mouse));
    bind(document, "mouseup", this.pointerHandler.bind(this, mouse));
    bind(document, "mousemove", this.pointerHandler.bind(this, mouse));
    bind(document, "mousewheel", this.pointerHandler.bind(this, mouse));
    bind(document, "click", this.pointerHandler.bind(this, mouse));
    bind(document, "touchstart", this.pointerHandler.bind(this, touch));
    bind(document, "touchend", this.pointerHandler.bind(this, touch));
    bind(document, "touchmove", this.pointerHandler.bind(this, touch));
    bind(document, "touchcancel", this.pointerHandler.bind(this, touch));
  }

  public teardown(): void {
    // Nothing to teardown
  }

  public reset(): void {
    this.lastMoveState = null;
    this.lastMoveTime = 0;
  }

  private pointerHandler(handler: IPointerModule, evt: Event): void {
    let states = handler.transform(evt);
    for (let state of states) {
      this.processState(state, evt);
    }
  }

  private processState(state: IPointerState, evt: Event): void {
    switch (state.event) {
      case "click":
        if (config.pointerTargetCoords) {
          this.addClickTargetCoords(state, evt);
        }
        addEvent({type: this.eventName, state});
        break;
      case "mousemove":
      case "touchmove":
        if (this.lastMoveState == null
          || this.checkDistance(this.lastMoveState, state)
          || this.checkTime(evt.timeStamp)) {
          this.lastMoveState = state;
          this.lastMoveTime = evt.timeStamp;
          addEvent({type: this.eventName, state});
        }
        break;
      default:
        addEvent({type: this.eventName, state});
        break;
    }
  }

  private checkDistance(stateOne: IPointerState, stateTwo: IPointerState): boolean {
    let dx = stateOne.x - stateTwo.x;
    let dy = stateOne.y - stateTwo.y;
    return (dx * dx + dy * dy > this.distanceThreshold * this.distanceThreshold);
  }

  private checkTime(time: number): boolean {
    return time - this.lastMoveTime > this.timeThreshold;
  }

  private addClickTargetCoords(state: IPointerState, evt: Event): void {
    const target = evt && evt.target;
    let targetX: number = null;
    let targetY: number = null;
    if (target && target instanceof Element) {
      const targetRect = getBoundingClientRect(target);
      const evtX: number = "clientX" in evt ? Math.floor(evt["clientX"]) : null;
      const evtY: number = "clientY" in evt ? Math.floor(evt["clientY"]) : null;
      if (targetRect && evtX !== null && evtY !== null) {
        // 1. Both targetXY and evtXY contain coordinates offset from the top left corner of the viewport.
        // 2. evtXY are provided by the browser integers (Math.floor of the actual coordinate), while rectangle
        // left/top are floats. To avoid negative targetXY, we need to floor rectangle values as well.
        targetX = evtX - Math.floor(targetRect.left);
        targetY = evtY - Math.floor(targetRect.top);
      }
    }
    state.targetX = targetX;
    state.targetY = targetY;
  }
}
