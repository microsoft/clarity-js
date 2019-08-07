import hash from "@src/data/hash";

export let pageId: string;
export let sessionId: string;
export let tenantId: string;
let count: number = 0;

export function start(): void {
    pageId = guid();
    sessionId = guid();
    tenantId = hash(top.location.host);
    count = 0;
}

export function end(): void {
    pageId = null;
    sessionId = null;
    tenantId = null;
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
