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
            this.addTargetCoords(state, evt.target);
          }
          addEvent({type: this.eventName, state});
        }
        break;
      default:
        if (config.pointerTargetCoords) {
          this.addTargetCoords(state, evt.target);
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

  private addTargetCoords(state: IPointerState, target: EventTarget): void {
    if (target && target instanceof Element) {
      const rect = (target as Element).getBoundingClientRect();
      const de = document.documentElement;
      const rectLeft = rect.left + de.scrollLeft;
      const rectTop = rect.top + de.scrollTop;
      state.targetX = state.x - rectLeft;
      state.targetY = state.y - rectTop;
    } else {
      state.targetX = null;
      state.targetY = null;
    }
  }
}
