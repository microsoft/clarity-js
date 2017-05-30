import { instrument } from "./instrumentation";

let apiContainer = {
  // APIs that are critical to Clarity core functions
  // Without these Clarity won't work properly
  required: [
    "document.implementation.createHTMLDocument",
    "document.documentElement.classList",
    "Function.prototype.bind",
    "window.addEventListener"
  ],

  // APIs that can be missing without breaking Clarity
  optional: [
    "performance",
    "performance.getEntriesByType"
  ]
};

export function checkApi(): boolean {
  let missingApis = checkArrayOfApiStrings(apiContainer.required);
  let criticalApiMissing = missingApis.length > 0;
  missingApis = missingApis.concat(checkArrayOfApiStrings(apiContainer.optional));
  if (missingApis.length > 0) {
    let apiMissingEventState: IApiMissingEventState = {
      type: Instrumentation.ApiMissing,
      missingApis
    };
    instrument(apiMissingEventState);
  }
  return !criticalApiMissing;
}

function checkArrayOfApiStrings(apis: string[]): string[] {
  let missingApis = [];
  for (let i = 0; i < apis.length; i++) {
    if (!evalApi(apis[i])) {
      missingApis.push(apis[i]);
    }
  }
  return missingApis;
}

// While eval() is traditionally considered a dangerous function (for a valid reason),
// its use for the below scenario is safe:
//  1. Here eval() is only executed on pre-defined strings (vs. user input)
//  2. It runs in the browser, so executing malicious code with elevated permission is not an issue
//  3. It is convenient to list required APIs as strings and then use these same strings for logging,
//     versus storing APIs together with their descriptors for event logging.
// Reference:
// http://stackoverflow.com/questions/197769/when-is-javascripts-eval-not-evil
function evalApi(apiString) {
  // If API that we are checking for doesn't exist, acessing it will either directly
  // throw an error or, if it returns a value that evaluates to false (e.g. undefined),
  // we manually throw an error to invoke catch code block.
  // If we catch an error, then desired API is unavailable.
  let evalStr = `if (!(${apiString})) throw new Error()`;
  let apiExists = true;
  try {
    // tslint:disable-next-line:no-eval
    eval(evalStr);
  } catch (e) {
    // Eval failed. Api is not available.
    apiExists = false;
  }
  return apiExists;
}
