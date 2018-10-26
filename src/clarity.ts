import { IConfig, State } from "../types/index";
import { config } from "./config";
import { activate, onTrigger, state, teardown } from "./core";
import { mapProperties } from "./utils";

export { version } from "./core";

export function start(customConfig?: IConfig) {
  if (state !== State.Activated) {
    mapProperties(customConfig, null, true, config);
    const uploadUrl = config.uploadUrl;
    if(uploadUrl) {
      if(!config.urlBlacklist) {
        config.urlBlacklist = [uploadUrl]
      } else if (config.urlBlacklist.indexOf(uploadUrl) === -1){
          config.urlBlacklist.push(uploadUrl);
      }
    }
    
    activate();
  }
}

export function stop() {
  teardown();
}

export function trigger(key: string) {
  onTrigger(key);
}
