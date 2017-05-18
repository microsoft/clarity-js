import { config } from "../src/config";
import { start } from "../src/wireup";

let sentBytes: string[] = [];

export function getSentBytes(): string[] {
  return sentBytes;
}

export function clearSentBytes(): void {
  sentBytes = [];
}

// Set up page environment for testing purposes
// Make config uri non-empty, so that Clarity executes send
config.uploadUrl = "https://www.claritytest.com/test";

// Allow instrumentation events
config.instrument = true;

// Override send function to store bytes for test verification,
// instead of actually sending it to the backend
XMLHttpRequest.prototype.send = (data: any) => {
  sentBytes.push(data);
};

start();
