import { DecodedToken, Token } from "@clarity-types/data";
import { Metric } from "@clarity-types/metrics";

export default function(tokens: Token[]): DecodedToken[] {
    let lastType = null;
    let metric = [];
    let decoded: DecodedToken[] = [];
    for (let token of tokens) {
        let type = typeof(token);
        switch (type) {
            case "string":
                if (type !== lastType && lastType !== null) {
                    decoded.push(process(metric));
                    metric = [];
                }
                metric.push(token);
                break;
            case "number":
                metric.push(token);
                break;
        }
        lastType = type;
    }

    return decoded;
}

function process(metric: any[]): DecodedToken {
    let name = metric[0];
    let type = name[name.length - 1];
    let output: DecodedToken = { metric: name, type };

    switch (type) {
        case Metric.Timer:
            output["duration"] = metric[1];
            output["count"] = metric[2];
            break;
        case Metric.Counter:
            output["counter"] = metric[1];
            break;
        case Metric.Histogram:
            output["sum"] = metric[1];
            output["min"] = metric[2];
            output["max"] = metric[3];
            output["sumsquared"] = metric[4];
            output["count"] = metric[5];
            break;
        case Metric.Mark:
            output["tag"] = metric[1];
            output["start"] = metric[2];
            output["end"] = metric[3];
            break;
    }

    return output;
}
