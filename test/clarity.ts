import { IConfig } from "../clarity";
import { start } from "../src/clarity";
import { config } from "../src/config";

// Make config uri non-empty, so that Clarity executes send
// Allow instrumentation events
export let testConfig: IConfig = {
  uploadUrl: "https://www.claritytest.com/test",
  instrument: true,
  validateConsistency: true
};

start(testConfig);
