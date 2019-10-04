import { Config } from "@clarity-types/core";
import * as core from "@src/core";
import configuration from "@src/core/config";
import { bind } from "@src/core/event";
import * as data from "@src/data";
import * as diagnostic from "@src/diagnostic";
import * as interaction from "@src/interaction";
import * as layout from "@src/layout";

let status = false;

export function config(override: Config): boolean {
  // Process custom configuration overrides, if available
  if (status) { return false; }
  for (let key in override) {
      if (key in configuration) { configuration[key] = override[key]; }
  }
  return true;
}

export function start(override: Config = {}): void {
  if (core.check()) {
    config(override);
    status = true;

    core.start();
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
    core.end();

    status = false;
  }
}

export function tag(key: string, value: string): void {
  // Do not process tags if Clarity is not already activated
  if (status) {
    data.tag(key, value);
  }
}

export function active(): boolean {
  return status;
}
