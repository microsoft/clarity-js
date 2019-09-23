import { Token } from "../types/data";
import { IMetric } from "../types/metric";

let metrics: IMetric = null;

export default function(tokens: Token[]): IMetric {
    let i = 0;
    metrics = {};
    while (i < tokens.length) {
        metrics[tokens[i++] as number] = tokens[i++] as number;
    }
    return metrics;
}
