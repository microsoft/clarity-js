import {Event, Flush, Token } from "@clarity-types/data";
import { Metric } from "@clarity-types/metric";
import time from "@src/core/time";
import { metadata } from "@src/data/metadata";
import * as metric from "@src/metric";
import queue from "./queue";

export default function(): void {
    let t = time();
    let tokens: Token[] = [t, Event.Metadata];

    metric.counter(Metric.WireupTime, t);

    tokens.push(metadata.sequence);
    tokens.push(metadata.version);
    tokens.push(metadata.pageId);
    tokens.push(metadata.userId);
    tokens.push(metadata.projectId);
    tokens.push(metadata.url);
    tokens.push(metadata.title);
    tokens.push(metadata.referrer);
    queue(tokens, Flush.None);
}
