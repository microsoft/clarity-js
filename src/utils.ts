import { IEventArray } from "@clarity-types/core";
import { IClarityAssertFailedEventState, Instrumentation } from "@clarity-types/instrumentation";
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

export function traverseNodeTree(root: Node, processingFunc: (node: Node) => void, includeRoot: boolean = true): void {
  let queue = [root];
  while (queue.length > 0) {
    let next = queue.shift();
    let nextChild: Node = next.firstChild;
    while (nextChild) {
      queue.push(nextChild);
      nextChild = nextChild.nextSibling;
    }
    if (next !== root || includeRoot) {
      processingFunc(next);
    }
  }
}

export function roundingMapFunction(name: string, value: any): any {
  return (isNumber(value)) ? Math.round(value) : value;
}

export function isNumber(value: any): boolean {
  return (typeof value === "number" && !isNaN(value));
}

export function assert(condition: boolean, source: string, comment: string): void {
  if (condition === false) {
    debug(`>>> Clarity Assert failed\nSource: ${source}\nComment: ${comment}`);
    let eventState: IClarityAssertFailedEventState = {
      type: Instrumentation.ClarityAssertFailed,
      source,
      comment
    };
    instrument(eventState);
  }
}

export function debug(text: string): void {
  if (config.debug && console.log) {
    console.log(`(Clarity) ${text}`);
  }
}

export function getEventId(eventArray: IEventArray): number {
  return eventArray[0];
}

export function getEventType(eventArray: IEventArray): string {
  return eventArray[1];
}

export function mask(text: string): string {
  return text.replace(/\S/gi, "*");
}

export function getBoundingClientRect(element: Element): ClientRect | DOMRect {
  // In IE, calling getBoundingClientRect on a node that is disconnected
  // from a DOM tree, sometimes results in a 'Unspecified Error'
  // Wrapping this in try/catch is faster than checking whether element is connected to DOM
  let targetRect: ClientRect | DOMRect = null;
  try {
    targetRect = element.getBoundingClientRect();
  } catch (e) {
      // Ignore
  }
  return targetRect;
}
