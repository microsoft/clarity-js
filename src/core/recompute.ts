import * as metrics from "@src/metrics/metrics";
import * as document from "@src/viewport/document";

export default function(): void {
    document.compute();
    metrics.compute();
}
