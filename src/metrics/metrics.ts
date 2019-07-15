import { Event, Flush } from "@clarity-types/data";
import { time } from "@src/core";
import { queue } from "@src/data/upload";
import serialize from "./serialize";

export function compute(): void {
    queue(time(), Event.Metrics, serialize(), Flush.None);
}
