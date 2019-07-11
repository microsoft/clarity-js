import { Timer } from "../metrics/enums";
import * as timer from "../metrics/timer";
import serializeDOM from "./serialization/dom";
import serializeMetrics from "./serialization/metrics";

export default async function(): Promise<string> {
    let tracker = Timer.Serialize;
    timer.start(tracker);
    let json = {
        dom: await serializeDOM(),
        metrics: await serializeMetrics()
    };
    let output = JSON.stringify(json);
    timer.stop(tracker);
    return output;
}
