import {Event, Token} from "@clarity-types/data";
import { Metric } from "@clarity-types/metric";
import time from "@src/core/time";
import { metadata } from "@src/data/metadata";
import * as metric from "@src/metric";

export default function(envelope: boolean = false): Token[] {
    let t = time();
    let tokens: Token[] = envelope ? [] : [t, Event.Metadata];

    if (!envelope) { metric.counter(Metric.WireupTime, t); }

    tokens.push(metadata.sequence);
    tokens.push(metadata.version);
    tokens.push(metadata.pageId);
    tokens.push(metadata.userId);
    tokens.push(metadata.projectId);
    if (envelope === false) {
        tokens.push(metadata.url);
        tokens.push(metadata.title);
        tokens.push(metadata.referrer);
    }
    return tokens;
}
