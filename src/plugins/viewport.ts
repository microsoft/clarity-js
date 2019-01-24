import { IPlugin } from "../../types/core";
import { IViewportState } from "../../types/viewport";
import { addEvent, bind } from "../core";

export default class Viewport implements IPlugin {
  private eventName = "Viewport";
  private distanceThreshold = 20;
  private lastViewportState: IViewportState;
  private body = document.body;
  private documentElement = document.documentElement;

  public activate() {
    this.processState(this.getViewport("discover"));
    bind(window, "scroll", this.viewportHandler.bind(this));
    bind(window, "resize", this.viewportHandler.bind(this));
    bind(window, "pageshow", this.viewportHandler.bind(this));
    bind(window, "pagehide", this.viewportHandler.bind(this));
    bind(document, "visibilitychange", this.viewportHandler.bind(this));
  }

  public teardown() {
    // Nothing to teardown
  }

  public reset(): void {
    this.lastViewportState = null;
  }

  private viewportHandler(evt: Event) {
    let viewportState = this.getViewport(evt.type);
    this.processState(viewportState);
  }

  private getViewport(type: string): IViewportState {
    let viewport: IViewportState = {
      viewport: {
        x: "pageXOffset" in window ? window.pageXOffset : this.documentElement.scrollLeft,
        y: "pageYOffset" in window ? window.pageYOffset : this.documentElement.scrollTop,
        width: "innerWidth" in window ? window.innerWidth : this.documentElement.clientWidth,
        height: "innerHeight" in window ? window.innerHeight : this.documentElement.clientHeight
      },
      document: {
        width: this.body ? this.body.clientWidth : null,
        height: this.getDocumentHeight()
      },
      dpi: "devicePixelRatio" in window ? window.devicePixelRatio : -1,
      visibility: "visibilityState" in document ? document.visibilityState : "default",
      event: type
    };
    return viewport;
  }

  // body.clientHeight gets set to viewport height when doctype is not set for a document.
  // The more accurate way to calculate browser height is to get the maximum of body and documentElement heights
  private getDocumentHeight(): number {
     let bodyClientHeight = this.body ? this.body.clientHeight : null;
     let bodyScrollHeight = this.body ? this.body.scrollHeight : null;
     let bodyOffsetHeight = this.body ? this.body.offsetHeight : null;
     let documentClientHeight = this.documentElement ? this.documentElement.clientHeight : null;
     let documentScrollHeight = this.documentElement ? this.documentElement.scrollHeight : null;
     let documentOffsetHeight = this.documentElement ? this.documentElement.offsetHeight : null;
     let documentHeight = Math.max(bodyClientHeight, bodyScrollHeight, bodyOffsetHeight,
       documentClientHeight, documentScrollHeight, documentOffsetHeight);
     return documentHeight;
  }

  private processState(state: IViewportState) {
    let recordState = true;
    if (state.event === "scroll"
      && this.lastViewportState !== null
      && !this.checkDistance(this.lastViewportState, state)) {
      recordState = false;
    }
    if (recordState) {
      this.lastViewportState = state;
      addEvent({type: this.eventName, state});
    }
  }

  private checkDistance(stateOne: IViewportState, stateTwo: IViewportState) {
    let dx = stateOne.viewport.x - stateTwo.viewport.x;
    let dy = stateOne.viewport.y - stateTwo.viewport.y;
    return (dx * dx + dy * dy > this.distanceThreshold * this.distanceThreshold);
  }
}
