
import {Event, Metric, Token} from "@clarity-types/data";
import * as task from "@src/core/task";
import time from "@src/core/time";
import { observe } from "@src/data/target";
import tokenize from "@src/data/token";
import { queue } from "@src/data/upload";
import { getMatch } from "@src/layout/dom";
import * as connection from "@src/performance/connection";
import * as contentful from "@src/performance/contentful";
import * as longtask from "@src/performance/longtask";
import * as memory from "@src/performance/memory";
import * as navigation from "@src/performance/navigation";
import * as network from "@src/performance/network";
import * as paint from "@src/performance/paint";

export default async function(type: Event): Promise<void> {
    let t = time();
    let tokens: Token[] = [t, type];
    let timer = Metric.PerformanceDuration;
    task.start(timer);
    switch (type) {
        case Event.Connection:
            tokens.push(connection.data.downlink);
            tokens.push(connection.data.rtt);
            tokens.push(connection.data.saveData);
            tokens.push(connection.data.type);
            connection.reset();
            queue(tokens);
            break;
        case Event.Contentful:
            tokens.push(contentful.data.load);
            tokens.push(contentful.data.render);
            tokens.push(contentful.data.size);
            tokens.push(observe(contentful.data.target as Node));
            contentful.reset();
            queue(tokens);
            break;
        case Event.LongTask:
            tokens = [longtask.state.time, type];
            tokens.push(longtask.state.data.duration);
            longtask.reset();
            queue(tokens);
            break;
        case Event.Memory:
            tokens.push(memory.data.limit);
            tokens.push(memory.data.available);
            tokens.push(memory.data.consumed);
            memory.reset();
            queue(tokens);
            break;
        case Event.Navigation:
            tokens.push(navigation.data.fetchStart);
            tokens.push(navigation.data.connectStart);
            tokens.push(navigation.data.connectEnd);
            tokens.push(navigation.data.requestStart);
            tokens.push(navigation.data.responseStart);
            tokens.push(navigation.data.responseEnd);
            tokens.push(navigation.data.domInteractive);
            tokens.push(navigation.data.domComplete);
            tokens.push(navigation.data.loadEventEnd);
            tokens.push(navigation.data.size);
            tokens.push(navigation.data.type);
            tokens.push(navigation.data.protocol);
            navigation.reset();
            queue(tokens);
            break;
        case Event.Network:
            for (let state of network.state) {
                if (task.shouldYield(timer)) { await task.pause(timer); }
                let data = state.data;
                data.target = observe(getMatch(state.url));
                let metadata = [];
                let keys = ["start", "duration", "size", "target", "initiator", "protocol", "host"];
                for (let key of keys) {
                    switch (key) {
                        case "target":
                            if (data[key]) { tokens.push(data[key] as number); }
                            break;
                        case "initiator":
                        case "protocol":
                        case "host":
                            metadata.push(data[key]);
                            break;
                        default:
                            tokens.push(data[key]);
                            break;
                    }
                }
                tokens = tokenize(tokens, metadata);
            }
            queue(tokens);
            network.reset();
            break;
        case Event.Paint:
            tokens = [paint.state.time, type];
            tokens.push(paint.state.data.name);
            paint.reset();
            queue(tokens);
            break;
    }
    task.stop(timer);
}
