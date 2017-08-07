import { start } from "../src/clarity";
import { config } from "../src/config";

let sentBytes: string[] = [];

export function getSentBytes(): string[] {
  return sentBytes;
}

export function clearSentBytes(): void {
  sentBytes = [];
}

// Set up page environment for testing

// Override send function to store bytes for test verification,
// instead of actually sending it to the backend
XMLHttpRequest.prototype.send = (data: any) => {
  sentBytes.push(data);
};

// Make config uri non-empty, so that Clarity executes send
// Allow instrumentation events
let customConfig: IConfig = {
  uploadUrl: "https://www.claritytest.com/test",
  instrument: true,
  ensureConsistency: true,
};

start(customConfig);
