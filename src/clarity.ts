import { IConfig } from "@clarity-types/core";
import * as core from "@src/core";
import configuration from "@src/core/config";
import { bind } from "@src/core/event";
import * as data from "@src/data";
import * as diagnostic from "@src/diagnostic";
import * as interaction from "@src/interaction";
import * as layout from "@src/layout";
import * as metric from "@src/metric";
export { tag } from "@src/data/tag";

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
    status = true;

    core.start();
    metric.start();
    data.start();
    diagnostic.start();
    layout.start();
    interaction.start();
  }
}

export function pause(): void {
  end();
  bind(document, "mousemove", resume);
  bind(document, "touchstart", resume);
  bind(window, "resize", resume);
  bind(window, "scroll", resume);
  bind(window, "pageshow", resume);
}

export function resume(): void {
  start();
}

export function end(): void {
  if (status) {
    interaction.end();
    layout.end();
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
