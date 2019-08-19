import { Flush, IMetadata, Token } from "@clarity-types/data";
import version from "@src/core/version";
import encode from "@src/data/encode";
import hash from "@src/data/hash";
import queue from "@src/data/queue";

export let metadata: IMetadata = null;

export function start(): void {
    metadata = {
      sequence: 0,
      version,
      pageId: guid(),
      userId: guid(),
      projectId: hash(location.host),
      url: location.href,
      title: document.title,
      referrer: document.referrer
    };

    queue(encode(), Flush.None);
}

export function end(): void {
    metadata = null;
}

export function envelope(): Token[] {
    metadata.sequence++;
    return encode(true);
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
