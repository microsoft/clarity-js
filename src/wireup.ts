import { config } from "./config";
import { activate, bind, teardown } from "./core";

if (config.activateEvent) {
  bind(window, config.activateEvent, activate);
} else {
  setTimeout(activate, 0);
}
