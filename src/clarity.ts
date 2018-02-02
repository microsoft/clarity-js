import { IConfig, State } from "../clarity";
import { config } from "./config";
import { activate, onTrigger, state, teardown, version } from "./core";
import { mapProperties } from "./utils";

export { version } from "./core";

export function start(customConfig?: IConfig) {
  if (state !== State.Activated) {
    mapProperties(customConfig, null, true, config);
    activate();
  }
}

export function stop() {
  teardown();
}

export function trigger(key: string) {
  onTrigger(key);
}
