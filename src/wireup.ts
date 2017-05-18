import { config } from "./config";
import { activate, bind, state, teardown } from "./core";

export function start(customConfig?: IConfig) {
  if (state !== State.Activated) {
    for (let property in customConfig) {
      if (customConfig.hasOwnProperty(property) && property in config) {
        config[property] = customConfig[property];
      }
    }
    activate();
  }
}

export function stop() {
  teardown();
}
