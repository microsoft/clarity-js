import { Event, Flush } from "@clarity-types/data";
import queue from "@src/core/queue";
import time from "@src/core/time";
import encode from "./encode";

export function compute(): void {
    queue(time(), Event.Metrics, encode(), Flush.None);
}
