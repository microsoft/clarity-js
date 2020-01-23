import { Event, Token } from "../types/data";
import { PerformanceEvent } from "../types/decode/performance";
import { ConnectionData, LargestContentfulPaintData, LongTaskData, MemoryData } from "../types/performance";
import { NavigationData, NetworkData, PaintData } from "../types/performance";

export function decode(tokens: Token[]): PerformanceEvent  {
    let time = tokens[0] as number;
    let event = tokens[1] as Event;
    switch (event) {
        case Event.Connection:
            let connectionData: ConnectionData = {
                downlink: tokens[2] as number,
                rtt: tokens[3] as number,
                saveData: tokens[4] as number,
                type: tokens[5] as string
            };
            return { time, event, data: connectionData };
        case Event.ContentfulPaint:
            let contentfulData: LargestContentfulPaintData = {
                load: tokens[2] as number,
                render: tokens[3] as number,
                size: tokens[4] as number,
                target: tokens[5] as number
            };
            return { time, event, data: contentfulData };
        case Event.LongTask:
            let longTaskData: LongTaskData = {
                duration: tokens[2] as number,
                attributionName: tokens[3] as string,
                attributionContainer: tokens[4] as string,
                attributionType: tokens[5] as string,
                name: tokens[6] as string
            };
            return { time, event, data: longTaskData };
        case Event.Memory:
            let memoryData: MemoryData = {
                limit: tokens[2] as number,
                available: tokens[3] as number,
                consumed: tokens[4] as number
            };
            return { time, event, data: memoryData };
        case Event.Navigation:
            let navigationData: NavigationData = {
                fetchStart: tokens[2] as number,
                connectStart: tokens[3] as number,
                connectEnd: tokens[4] as number,
                requestStart: tokens[5] as number,
                responseStart: tokens[6] as number,
                responseEnd: tokens[7] as number,
                domInteractive: tokens[8] as number,
                domComplete: tokens[9] as number,
                loadEventStart: tokens[10] as number,
                loadEventEnd: tokens[11] as number,
                redirectCount: tokens[12] as number,
                size: tokens[13] as number,
                type: tokens[14] as string,
                protocol: tokens[15] as string
            };
            return { time, event, data: navigationData };
        case Event.Network:
            let lastType = null;
            let network = [];
            let stringIndex = 0;
            let networkData: NetworkData[] = [];
            for (let i = 2; i < tokens.length; i++) {
                let token = tokens[i];
                let type = typeof(token);
                switch (type) {
                    case "number":
                        if (type !== lastType && lastType !== null) {
                            networkData.push(process(network, stringIndex));
                            network = [];
                            stringIndex = 0;
                        }
                        network.push(token);
                        stringIndex++;
                        break;
                    case "string":
                        network.push(token);
                        break;
                    case "object":
                        // Reference: src/data/token.ts
                        // Continuing the example used above, following code expands an array of tokens by getting rid of any optimizations
                        // E.g. Current token: [1,3], from array of tokens: ["hello", "world", "coding", "language", [1, 3], "example"]
                        // Following code will expand [1,3] into "world", "language".
                        if (token === null) {
                            type = null;
                            if (stringIndex < 3) { stringIndex++; }
                            network.push(token);
                        } else {
                            let subtoken = token[0];
                            let subtype = typeof(subtoken);
                            switch (subtype) {
                                case "number":
                                    for (let t of (token as number[])) {
                                        network.push(tokens.length > t ? tokens[t] : null);
                                    }
                                    break;
                            }
                        }
                        break;
                }
                lastType = type;
            }
            // Process last node
            networkData.push(process(network, stringIndex));
            return { time, event, data: networkData };
        case Event.Paint:
            let paintData: PaintData = { name: tokens[2] as string };
            return { time, event, data: paintData };
    }
}

function process(network: any[] | number[], stringIndex: number): NetworkData {
    // Checking for null values since different browsers implement
    // resource timing spec differently. For instance, not all version of Edge support
    // transferSize property.
    return {
        start: network[0] as number,
        duration: network[1] as number,
        size: network[2] as number,
        target: stringIndex > 3 ? network[3] as number : null,
        initiator: network[stringIndex] as string,
        protocol: network[stringIndex + 1] as string,
        host: network[stringIndex + 2] as string,
    };
}
