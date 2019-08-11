import { Event, Flush, IMetadata } from "@clarity-types/data";
import time from "@src/core/time";
import version from "@src/core/version";
import encode from "@src/data/encode";
import hash from "@src/data/hash";
import queue from "@src/data/queue";

export let metadata: IMetadata = null;
let count: number = 0;

export function start(): void {
    count = 0;
    metadata = {
      version,
      pageId: guid(),
      userId: guid(),
      siteId: hash(location.host),
      url: location.href,
      title: document.title
    };

    queue(time(), Event.Metadata, encode(), Flush.None);
}

export function end(): void {
    metadata = null;
    count = 0;
}

export function sequence(): number {
    return count++;
}

// Credit: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
// Excluding 3rd party code from tslint
// tslint:disable
function guid() {
    let d = new Date().getTime();
    if (window.performance && performance.now) {
      // Use high-precision timer if available
      d += performance.now(); 
    }
    let uuid = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      let r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}
// tslint:enable
