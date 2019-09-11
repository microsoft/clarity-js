import { ICookieData, IEnvelope, IMetadata, IPage, Token, Upload } from "@clarity-types/data";
import config from "@src/core/config";
import version from "@src/core/version";
import encode from "@src/data/encode";
import hash from "@src/data/hash";

const CLARITY_COOKIE_NAME: string = "_clarity";
const CLARITY_COOKIE_SEPARATOR: string = "|";
const CLARITY_SESSION_LENGTH = 30 * 60 * 1000;
export let metadata: IMetadata = null;

export function start(): void {
    let cookie: ICookieData = read();
    let timestamp = Date.now();
    let pageId = id();
    let projectId = config.projectId || hash(location.host);
    let userId = cookie && cookie.userId ? cookie.userId : id();
    let sessionId = cookie && cookie.sessionId && timestamp - cookie.timestamp < CLARITY_SESSION_LENGTH ? cookie.sessionId : id();
    let e: IEnvelope = { sequence: 0, version, pageId, userId, sessionId, projectId, upload: Upload.Async, end: 0 };
    let p: IPage = { url: location.href, title: document.title, referrer: document.referrer };
    metadata = { page: p, envelope: e };
    track({ userId, sessionId, timestamp });
    encode();
}

export function end(): void {
    metadata = null;
}

export function envelope(last: boolean, backup: boolean = false): Token[] {
    let upload = backup ? Upload.Backup : (last && "sendBeacon" in navigator ? Upload.Beacon : Upload.Async);
    let e = metadata.envelope;
    if (upload !== Upload.Backup) { e.sequence++; }
    return [e.sequence, e.version, e.pageId, e.userId, e.sessionId, e.projectId, upload, last ? 1 : 0];
}

function id(): string {
    return Math.random().toString(36).slice(-6) + Date.now().toString(36).slice(-4);
}

function track(data: ICookieData): void {
  let expiry = new Date();
  expiry.setDate(expiry.getDate() + config.expire);
  let expires = expiry ? "expires=" + expiry.toUTCString() : "";
  let value = `${data.userId}|${data.sessionId}|${data.timestamp}` + ";" + expires + ";path=/";
  document.cookie = CLARITY_COOKIE_NAME + "=" + value;
}

function read(): ICookieData {
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
