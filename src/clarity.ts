import { Config } from "@clarity-types/core";
import * as core from "@src/core";
import configuration from "@src/core/config";
import { bind } from "@src/core/event";
import measure from "@src/core/measure";
import * as task from "@src/core/task";
import * as data from "@src/data";
import * as diagnostic from "@src/diagnostic";
import * as interaction from "@src/interaction";
import * as layout from "@src/layout";
import * as performance from "@src/performance";

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
    measure(diagnostic.start)();
    measure(layout.start)();
    measure(interaction.start)();
    measure(performance.start)();
  }
}

function restart(): void {
  start();
}

export function suspend(): void {
  end();
  bind(document, "mousemove", restart);
  bind(document, "touchstart", restart);
  bind(window, "resize", restart);
  bind(window, "scroll", restart);
  bind(window, "pageshow", restart);
}

export function pause(): void {
  task.pause();
}

export function resume(): void {
  task.resume();
}

export function end(): void {
  if (status) {
    measure(performance.end)();
    measure(interaction.end)();
    measure(layout.end)();
    measure(diagnostic.end)();
    data.end();
    core.end();

    status = false;
  }
}

export function tag(key: string, value: string): void {
  // Do not process tags if Clarity is not already activated
  if (status) {
    measure(data.tag)(key, value);
  }
}

export function upgrade(key: string): void {
  // Do not process upgrade call if Clarity is not already activated and in lean mode
  if (status && configuration.lean) {
    measure(data.upgrade)(key);
  }
}

export function active(): boolean {
  return status;
}
