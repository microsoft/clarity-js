import { IEnvelope, IMetadata, IPage, Token, Upload } from "@clarity-types/data";
import config from "@src/core/config";
import version from "@src/core/version";
import encode from "@src/data/encode";
import hash from "@src/data/hash";

export let metadata: IMetadata = null;

export function start(): void {
    let pageId = config.pageId || guid();
    let userId = config.userId || guid();
    let projectId = config.projectId || hash(location.host);
    let e: IEnvelope = { sequence: 0, version, pageId, userId, projectId, upload: Upload.Async, end: 0 };
    let p: IPage = { url: location.href, title: document.title, referrer: document.referrer };
    metadata = { page: p, envelope: e };
    encode();
}

export function end(): void {
    metadata = null;
}

export function envelope(last: boolean, backup: boolean = false): Token[] {
    let upload = backup ? Upload.Backup : (last && "sendBeacon" in navigator ? Upload.Beacon : Upload.Async);
    let e = metadata.envelope;
    if (upload !== Upload.Backup) { e.sequence++; }
    return [e.sequence, e.version, e.pageId, e.userId, e.projectId, upload, last ? 1 : 0];
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
