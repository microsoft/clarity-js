import { IEvent } from "./core";

export interface IViewportEvent extends IEvent {
  state: IViewportState;
}

export interface IViewportRectangle {
  x: number; /* X coordinate of the element */
  y: number; /* Y coordinate of the element */
  width: number; /* Width of the element */
  height: number; /* Height of the element */
}

export interface IDocumentSize {
  width: number; /* Document width */
  height: number; /* Document height */
}

export interface IViewportState {
  viewport: IViewportRectangle; /* Viewport rectangle */
  document: IDocumentSize; /* Document size */
  dpi: number; /* DPI */
  visibility: string; /* Visibility state of the page */
  event: string; /* Source event */
}
