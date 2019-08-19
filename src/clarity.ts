import { IConfig } from "@clarity-types/core";
import * as core from "@src/core";
import * as data from "@src/data";
import * as diagnostic from "@src/diagnostic";
import * as dom from "@src/dom";
import * as interaction from "@src/interaction";
import * as metric from "@src/metric";
import * as viewport from "@src/viewport";

let status = false;

/* Initial discovery of DOM */
export function start(configuration: IConfig = {}): void {
  core.start(configuration);
  metric.start();
  data.start();
  diagnostic.start();
  dom.start();
  viewport.start();
  interaction.start();

  // Mark Clarity session as active
  status = true;
}

export function end(): void {
  interaction.end();
  viewport.end();
  dom.end();
  diagnostic.end();
  data.end();
  metric.end();
  core.end();

  status = false;
}

export function active(): boolean {
  return status;
}
