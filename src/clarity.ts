import { IConfig } from "@clarity-types/core";
import * as core from "@src/core";
import configuration from "@src/core/config";
import { bind } from "@src/core/event";
import * as data from "@src/data";
import * as diagnostic from "@src/diagnostic";
import * as interaction from "@src/interaction";
import * as dom from "@src/layout";
import * as metric from "@src/metric";

let status = false;

export function config(override: IConfig): boolean {
  // Process custom configuration overrides, if available
  if (status) { return false; }
  for (let key in override) {
      if (key in configuration) { configuration[key] = override[key]; }
  }
  return true;
}

export function start(override: IConfig = {}): void {
  if (core.check()) {
    config(override);
    core.start();
    metric.start();
    data.start();
    diagnostic.start();
    dom.start();
    interaction.start();

    // Mark Clarity session as active
    status = true;
  }
}

export function pause(): void {
  end();
  bind(document, "mousemove", resume);
  bind(document, "touchstart", resume);
  bind(window, "resize", resume);
  bind(window, "scroll", resume);
}

export function resume(): void {
  start();
}

export function end(): void {
  if (status) {
    interaction.end();
    dom.end();
    diagnostic.end();
    data.end();
    metric.end();
    core.end();

    status = false;
  }
}

export function active(): boolean {
  return status;
}
