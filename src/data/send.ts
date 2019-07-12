import serializeDOM from "../dom/serialize";
import { Timer } from "../metrics/enums";
import serializeMetrics from "../metrics/serialize";
import * as timer from "../metrics/timer";

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
