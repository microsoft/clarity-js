import { addEvent, bind, register } from "./core";
import * as mouse from "./pointer/mouse";
import * as touch from "./pointer/touch";

// Constants
export const PointerEventName = "Pointer";
export const DistanceThreshold = 20;  // Pixels
export const TimeThreshold = 500;  // Milliseconds

class Pointer implements IComponent {
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
          addEvent(PointerEventName, state);
        }
        break;
      default:
        addEvent(PointerEventName, state);
        break;
    }
  }

  private checkDistance(stateOne: IPointerState, stateTwo: IPointerState) {
    let dx = stateOne.x - stateTwo.x;
    let dy = stateOne.y - stateTwo.y;
    return (dx * dx + dy * dy > DistanceThreshold * DistanceThreshold);
  }

  private checkTime(time: number) {
    return time - this.lastMoveTime > TimeThreshold;
  }
}

register(new Pointer());
