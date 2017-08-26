import { start } from "../src/clarity";
import { config } from "../src/config";
import { defaultUpload } from "../src/core";

let onUploadCallbacks = [];
let sentBytes: string[] = [];

export function getSentBytes(): string[] {
  return sentBytes;
}

export function clearSentBytes(): void {
  sentBytes = [];
}

export function clearOnUploadCallbacks() {
  onUploadCallbacks = [];
}

export function addOnUploadCallback(newCallback: () => void) {
  onUploadCallbacks.push(newCallback);
}

// Set up page environment for testing

// Override send function to store bytes for test verification,
// instead of actually sending it to the backend
XMLHttpRequest.prototype.send = (data: any) => {
  sentBytes.push(data);
};

let testUploadHandler = (payload: string, onSuccess?: UploadCallback, onFailure?: UploadCallback) => {
  defaultUpload(payload, onSuccess, onFailure);
  for (let i = 0; i < onUploadCallbacks.length; i++) {
    onUploadCallbacks[i]();
  }
}

// Make config uri non-empty, so that Clarity executes send
// Allow instrumentation events
let customConfig: IConfig = {
  uploadUrl: "https://www.claritytest.com/test",
  instrument: true,
  validateConsistency: true,
};

start(customConfig);
