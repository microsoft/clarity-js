import { Event, UpgradeData } from "@clarity-types/data";
import config from "@src/core/config";
import encode from "@src/data/encode";

export let data: UpgradeData = null;

export function reset(): void {
    data = null;
}

export function upgrade(key: string): void {
    config.lean = false;
    data = { key };
    encode(Event.Upgrade);
}
