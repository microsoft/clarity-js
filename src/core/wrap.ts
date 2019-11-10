import { Metric } from "@clarity-types/data";
import config from "@src/core/config";
import * as metric from "@src/data/metric";

// tslint:disable-next-line: ban-types
export default function(method: Function): Function {
    return function(): void {
        let start = Date.now();
        method.apply(this, arguments);
        let duration = Date.now() - start;
        metric.counter(Metric.Cost, duration);
        metric.counter(Metric.Calls);
        if (duration > config.yield) {
            metric.counter(Metric.LongTasks);
            metric.measure(Metric.MaxBlockTime, duration);
        }
    };
}
