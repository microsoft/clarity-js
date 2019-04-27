import * as mouse from "./mouse";
import * as touch from "./touch";

import { IPlugin } from "@clarity-types/core";
import { IPointerModule, IPointerState } from "@clarity-types/pointer";
import { config } from "@src/config";
import { addEvent, bind } from "@src/core";

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
      case "mousemove":
      case "touchmove":
        if (this.lastMoveState == null
          || this.checkDistance(this.lastMoveState, state)
          || this.checkTime(evt.timeStamp)) {
          this.lastMoveState = state;
          this.lastMoveTime = evt.timeStamp;
          if (config.pointerTargetCoords) {
            this.addTargetCoords(state, evt);
          }
          addEvent({type: this.eventName, state});
        }
        break;
      default:
        if (config.pointerTargetCoords) {
          this.addTargetCoords(state, evt);
        }
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

  private addTargetCoords(state: IPointerState, evt: Event): void {
    const target = evt && evt.target;
    let targetX: number = null;
    let targetY: number = null;
    if (target && target instanceof Element) {

      // In IE, calling getBoundingClientRect on a node that is disconnected
      // from a DOM tree, sometimes results in a 'Unspecified Error'
      // Wrapping this in try/catch is faster than checking whether element is connected to DOM
      let targetRect = null;
      try {
        targetRect = target.getBoundingClientRect();
      } catch (e) {
          // Ignore
      }

      const evtX: number = "clientX" in evt ? evt["clientX"] : null;
      const evtY: number = "clientY" in evt ? evt["clientY"] : null;
      if (targetRect && evtX !== null && evtY !== null) {
        // targetRect contains coordinates of the target element relative to the viewport
        // evtX and evtY contain event coordinates relative to the viewport as well
        targetX = evtX - Math.floor(targetRect.left);
        targetY = evtY - Math.floor(targetRect.top);
      }
    }
    state.targetX = targetX;
    state.targetY = targetY;

    console.log("Event");
    console.log(evt);
    console.log("Target");
    console.log(evt.target);
    console.log("targetX: " + state.targetX + ", targetY: " + state.targetY);
    if (targetX < 0 || targetX > state.width || targetY < 0 || targetY > state.height) {
      alert("Error");
    }
  }
}
