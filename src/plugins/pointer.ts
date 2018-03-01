import { EventType, IPlugin, IPointerModule, IPointerState } from "../../clarity";
import { addEvent, bind } from "../core";
import * as mouse from "./pointer/mouse";
import * as touch from "./pointer/touch";

export default class Pointer implements IPlugin {
  private distanceThreshold = 20;
  private timeThreshold = 500;
  private lastMoveState: IPointerState;
  private lastMoveTime: number;

  public activate() {
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

  private pointerHandler(handler: IPointerModule, evt: Event) {
    let states = handler.transform(evt);
    for (let state of states) {
      this.processState(state, evt.timeStamp);
    }
  }

  private processState(state: IPointerState, time: number) {
    switch (state.event) {
      case "mousemove":
      case "touchmove":
        if (this.lastMoveState == null
          || this.checkDistance(this.lastMoveState, state)
          || this.checkTime(time)) {
          this.lastMoveState = state;
          this.lastMoveTime = time;
          addEvent({type: EventType.Pointer, state});
        }
        break;
      default:
        addEvent({type: EventType.Pointer, state});
        break;
    }
  }

  private checkDistance(stateOne: IPointerState, stateTwo: IPointerState) {
    let dx = stateOne.x - stateTwo.x;
    let dy = stateOne.y - stateTwo.y;
    return (dx * dx + dy * dy > this.distanceThreshold * this.distanceThreshold);
  }

  private checkTime(time: number) {
    return time - this.lastMoveTime > this.timeThreshold;
  }
}
