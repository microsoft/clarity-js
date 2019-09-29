import { Event, ICookieInfo, IEnvelope, IMetadata, IPageData, State, Token, Upload } from "@clarity-types/data";
import config from "@src/core/config";
import time from "@src/core/time";
import version from "@src/core/version";
import encode from "@src/data/encode";
import hash from "@src/data/hash";

const CLARITY_COOKIE_NAME: string = "_clarity";
const CLARITY_COOKIE_SEPARATOR: string = "|";
const CLARITY_SESSION_LENGTH = 30 * 60 * 1000;
export let metadata: IMetadata = null;

export function start(): void {
    let cookie: ICookieInfo = read();
    let ts = Date.now();
    let elapsed = time();
    let projectId = config.projectId || hash(location.host);
    let userId = cookie && cookie.userId ? cookie.userId : guid();
    let sessionId = cookie && cookie.sessionId && ts - cookie.timestamp < CLARITY_SESSION_LENGTH ? cookie.sessionId : ts.toString(36);
    let pageId = guid();
    let upload = Upload.Async;
    let lean = config.lean ? State.True : State.False;
    let e: IEnvelope = { elapsed, sequence: 0, version, pageId, userId, sessionId, projectId, upload, end: State.False };
    let p: IPageData = { timestamp: ts, elapsed, url: location.href, referrer: document.referrer, lean };

    metadata = { page: p, envelope: e };

    track({ userId, sessionId, timestamp: ts });
    encode(Event.Page);
    if (config.onstart) { config.onstart({ userId, sessionId, pageId}); }
}

export function end(): void {
    metadata = null;
}

export function envelope(last: boolean, backup: boolean = false): Token[] {
    let e = metadata.envelope;
    e.upload = backup ? Upload.Backup : (last && "sendBeacon" in navigator ? Upload.Beacon : Upload.Async);
    e.end = last ? State.True : State.False;
    if (e.upload !== Upload.Backup) {
      e.elapsed = time();
      e.sequence++;
    }

    return [e.elapsed, e.sequence, e.version, e.projectId, e.userId, e.sessionId, e.pageId, e.upload, e.end];
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

function track(data: ICookieInfo): void {
  let expiry = new Date();
  expiry.setDate(expiry.getDate() + config.expire);
  let expires = expiry ? "expires=" + expiry.toUTCString() : "";
  let value = `${data.userId}|${data.sessionId}|${data.timestamp}` + ";" + expires + ";path=/";
  document.cookie = CLARITY_COOKIE_NAME + "=" + value;
}

function read(): ICookieInfo {
  let cookies: string[] = document.cookie.split(";");
  if (cookies) {
    for (let i = 0; i < cookies.length; i++) {
      let pair: string[] = cookies[i].split("=");
      if (pair.length > 1 && pair[0].indexOf(CLARITY_COOKIE_NAME) >= 0 && pair[1].indexOf(CLARITY_COOKIE_SEPARATOR) > 0) {
        let parts = pair[1].split(CLARITY_COOKIE_SEPARATOR);
        if (parts.length === 3) {
          return { userId: parts[0], sessionId: parts[1], timestamp: parseInt(parts[2], 10) };
        }
      }
    }
  }
  return null;
}
