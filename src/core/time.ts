import { startTime } from "@src/core";

export default function(): number {
    return Math.round(performance.now() - startTime);
}
