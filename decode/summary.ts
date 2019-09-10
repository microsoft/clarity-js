import hash from "../src/data/hash";
import { Event, IDecodedEvent } from "../types/data";
import { IChecksumMap, IDecodedNode } from "../types/layout";

export default function(event: IDecodedEvent): IDecodedEvent {
    switch (event.event) {
        case Event.Discover:
        case Event.Mutation:
            let checksumMap: IDecodedEvent = {time: event.time, event: Event.ChecksumMap, data: []};
            let nodes: IDecodedNode[] = event.data;
            for (let node of nodes) {
                // Do not track nodes where we don't have a valid selector - e.g. text nodes
                if (node.selector && node.selector.length > 0) {
                    let checksum = hash(node.selector);
                    let data: IChecksumMap = { id: node.id, checksum, selector: node.selector };
                    checksumMap.data.push(data);
                }
            }
            return checksumMap;
    }
}
