import { Event, Flush } from "@clarity-types/data";
import queue from "@src/core/queue";
import time from "@src/core/time";
import serialize from "./serialize";

export function compute(): void {
    queue(time(), Event.Metrics, serialize(), Flush.None);
}
