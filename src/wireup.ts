import { config } from "./config";
import { activate, bind, teardown } from "./core";

export function start() {
  if (config.activateEvent) {
    bind(window, config.activateEvent, activate);
  } else {
    activate();
  }
}

export function stop() {
  teardown();
}
