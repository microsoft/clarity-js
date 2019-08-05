import { IConfig } from "@clarity-types/config";
import { State } from "@clarity-types/core";
import { config } from "./config";
import { activate, onCustomLog, onSetPageInfo, onTrigger, state, teardown } from "./core";
import { mapProperties } from "./utils";
export { version } from "./core";

export function start(customConfig?: IConfig): void {
  if (state !== State.Activated) {
    mapProperties(customConfig, null, true, config);
    activate();
  }
}

export function stop(): void {
  teardown();
}

export function trigger(key: string): void {
  onTrigger(key);
}

export function event(kvps: { [key: string]: any }): void {
  onCustomLog(kvps);
}

export function setPageInfo(pageId: string, userId: string): void {
  onSetPageInfo(pageId, userId);
}
