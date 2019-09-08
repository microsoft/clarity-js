import {Event, Token } from "@clarity-types/data";
import { Metric } from "@clarity-types/metric";
import time from "@src/core/time";
import { metadata } from "@src/data/metadata";
import * as metric from "@src/metric";
import { queue } from "./upload";

export default function(): void {
    let t = time();
    let tokens: Token[] = [t, Event.Page];
    metric.counter(Metric.LoadTime, t);
    tokens.push(metadata.page.url);
    tokens.push(metadata.page.title);
    tokens.push(metadata.page.referrer);
    queue(tokens);
}
