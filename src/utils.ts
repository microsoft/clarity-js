import { IClarityAssertFailedEventState, Instrumentation } from "../clarity";
import { config } from "./config";
import { instrument } from "./core";

// Credit: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
// Excluding 3rd party code from tslint
// tslint:disable
export function guid() {
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

export function mapProperties(sourceObj: object,
                              mapFunction: (name: string, value: any) => any,
                              ownPropertiesOnly: boolean,
                              outObj?: object): object {
  outObj = outObj || {};
  for (let property in sourceObj) {
    if (!ownPropertiesOnly || sourceObj.hasOwnProperty(property)) {
      let sourceValue = sourceObj[property];
      let outValue = mapFunction ? mapFunction(property, sourceValue) : sourceValue;
      if (typeof outValue !== "undefined") {
        outObj[property] = outValue;
      }
    }
  }
  return outObj;
}

export function traverseNodeTree(node: Node, processingFunc: (node: Node) => void) {
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

export function assert(condition: boolean, source: string, comment: string) {
  if (condition === false) {
    debug(`>>> Clarity Assert failed\nSource: ${source}\nComment: ${comment}`);
    let eventState: IClarityAssertFailedEventData = {
      type: Instrumentation.ClarityAssertFailed,
      source,
      comment
    };
    instrument(eventState);
  }
}

export function debug(text) {
  if (config.debug && console.log) {
    console.log(text);
  }
}
