import * as mouse from "./pointer/mouse";
import * as touch from "./pointer/touch";

import { IPlugin } from "@clarity-types/core";
import { IPointerModule, IPointerState } from "@clarity-types/pointer";
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
      this.processState(state, evt.timeStamp);
    }
  }

  private processState(state: IPointerState, time: number): void {
    switch (state.event) {
      case "mousemove":
      case "touchmove":
        if (this.lastMoveState == null
          || this.checkDistance(this.lastMoveState, state)
          || this.checkTime(time)) {
          this.lastMoveState = state;
          this.lastMoveTime = time;
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
}
