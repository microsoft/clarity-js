import { IPlugin, IViewportEventData, Origin, ViewportEventType } from "../../declarations/clarity";
import { addEvent, bind } from "../core";

export default class Viewport implements IPlugin {
  private distanceThreshold = 20;
  private lastViewportState: IViewportEventData;

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

  private getViewport(type: string): IViewportEventData {
    let de = document.documentElement;
    let body = document.body;
    let viewport: IViewportEventData = {
      viewport: {
        x: "pageXOffset" in window ? window.pageXOffset : de.scrollLeft,
        y: "pageYOffset" in window ? window.pageYOffset : de.scrollTop,
        width: "innerWidth" in window ? window.innerWidth : de.clientWidth,
        height: "innerHeight" in window ? window.innerHeight : de.clientHeight
      },
      document: {
        width: body ? body.clientWidth : null,
        height: body ? body.clientHeight : null
      },
      dpi: "devicePixelRatio" in window ? window.devicePixelRatio : -1,
      visibility: "visibilityState" in document ? document.visibilityState : "default",
      type
    };
    return viewport;
  }

  private processState(data: IViewportEventData) {
    let recordState = true;
    if (data.type === "scroll"
      && this.lastViewportState !== null
      && !this.checkDistance(this.lastViewportState, data)) {
      recordState = false;
    }
    if (recordState) {
      this.lastViewportState = data;
      addEvent({origin: Origin.Viewport, type: ViewportEventType.Viewport, data});
    }
  }

  private checkDistance(stateOne: IViewportEventData, stateTwo: IViewportEventData) {
    let dx = stateOne.viewport.x - stateTwo.viewport.x;
    let dy = stateOne.viewport.y - stateTwo.viewport.y;
    return (dx * dx + dy * dy > this.distanceThreshold * this.distanceThreshold);
  }
}
