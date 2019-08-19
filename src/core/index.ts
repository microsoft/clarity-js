import { IConfig } from "@clarity-types/core";
import config from "@src/core/config";
import * as event from "@src/core/event";

export function start(configuration: IConfig): void {
    // Process custom configuration, if available
    for (let key in configuration) {
        if (key in config) { config[key] = configuration[key]; }
    }

    event.reset();
}

export function end(): void {
    event.reset();
}
