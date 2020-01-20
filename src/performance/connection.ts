import { BooleanFlag, Event } from "@clarity-types/data";
import { ConnectionData, NavigatorConnection } from "@clarity-types/performance";
import encode from "./encode";

// Reference: https://wicg.github.io/netinfo/
export let data: ConnectionData;

export function start(): void {
    if (navigator && "connection" in navigator) {
        (navigator["connection"] as NavigatorConnection).addEventListener("change", recompute);
        recompute();
    }
}

function recompute(): void {
    let connection = navigator["connection"] as NavigatorConnection;
    data = {
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData ? BooleanFlag.True : BooleanFlag.False,
        type: connection.effectiveType
    };
    encode(Event.Connection);
}

export function reset(): void {
    data = null;
}

export function end(): void {
    reset();
}
