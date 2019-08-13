import { IConfig } from "@clarity-types/core";
import config from "@src/core/config";
import * as event from "@src/core/event";
import * as metadata from "@src/data/metadata";
import * as discover from "@src/dom/discover";
import * as mutation from "@src/dom/mutation";
import * as mouse from "@src/interactions/mouse";
import * as metrics from "@src/metrics";
import * as document from "@src/viewport/document";
import * as resize from "@src/viewport/resize";
import * as scroll from "@src/viewport/scroll";
import * as visibility from "@src/viewport/visibility";

let status = false;

/* Initial discovery of DOM */
export function start(configuration: IConfig = {}): void {

  // Process custom configuration, if available
  for (let key in configuration) {
    if (key in config) { config[key] = configuration[key]; }
  }

  event.reset();
  metrics.start();
  metadata.start();

  // DOM
  mutation.start();
  discover.start();

  // Viewport
  document.start();
  resize.start();
  visibility.start();
  scroll.start();

  // Pointer
  mouse.start();

  // Mark Clarity session as active
  status = true;
}

export function end(): void {
  event.reset();
  metadata.end();
  mutation.end();
  metrics.end();
  status = false;
}

export function active(): boolean {
  return status;
}
