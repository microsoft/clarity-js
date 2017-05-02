import { config } from "./config";
import { instrument } from "./instrumentation";

// Credit: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
// Excluding 3rd party code from tslint
// tslint:disable
export function guid() {
  let d = getUnixTimestamp();
  if (window.performance && typeof window.performance.now === "function") {
    d += performance.now(); //use high-precision timer if available
  }
  let uuid = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    let r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}
// tslint:enable

export function getUnixTimestamp(): number {
  return (window.performance && typeof performance.now === "function")
    ? performance.now() + performance.timing.navigationStart
    : new Date().getTime();
}

export function setCookie(cookieName: string, value: string, expDays?: number): void {
  let expDate = null;
  if (expDays) {
    expDate = new Date();
    expDate.setDate(expDate.getDate() + expDays);
  }
  let expires = expDate ? "expires=" + expDate.toUTCString() : "";
  let cookieValue = value + ";" + expires + ";path=/";
  document.cookie = cookieName + "=" + cookieValue;
}

export function getCookie(cookieName: string): string {
  let arrayOfCookies: string[] = document.cookie.split(";");
  if (arrayOfCookies) {
    for (let i = 0; i < arrayOfCookies.length; i++) {
      let cookiePair: string[] = arrayOfCookies[i].split("=");
      if (cookiePair && cookiePair.length > 1 && cookiePair[0].indexOf(cookieName) >= 0) {
        return cookiePair[1];
      }
    }
  }
  return null;
}

export function mapProperties(target: any, mapFunction: (name: string, value) => any, ownProperties: boolean): object {
  let map = target ? {} : target;
  for (let property in target) {
    if (!ownProperties || target.hasOwnProperty(property)) {
      let mapValue = mapFunction(property, target[property]);
      if (typeof mapValue !== "undefined") {
        map[property] = mapValue;
      }
    }
  }
  return map;
}

export function TraverseNodeTree(node: Node, processingFunc: (node: Node) => void) {
  let queue = [node];
  while (queue.length > 0) {
    let next = queue.shift();
    processingFunc(next);
    let nextChild = next.firstChild;
    while (nextChild) {
      queue.push(nextChild);
      nextChild = nextChild.nextSibling;
    }
  }
}

export function roundingMapFunction(name: string, value: any) {
  return (isNumber(value)) ? Math.round(value) : value;
}

export function isNumber(value: any): boolean {
  return (typeof value === "number" && !isNaN(value));
}

export function assert(condition: boolean, source: string) {
  if (condition === false) {
    let eventState: IClarityAssertFailedEventState = {
      type: Instrumentation.ClarityAssertFailed,
      source
    };
    instrument(eventState);
  }
}

export function debug(text) {
  if (config.debug && console.log) {
    console.log(text);
  }
}
