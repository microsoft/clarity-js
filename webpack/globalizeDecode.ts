import * as decode from "@decode/clarity";
import * as clarity from "@src/clarity";

// When built with webpack for prod, compiled clarity-js bundle doesn't expose the module anywhere on the page.
// Since we need clarity-js having the decode functionality to be available globally, we can create a wrapper
// module that would assign clarity to window.
if (typeof window !== "undefined") {
    if ((window as any).clarity === undefined) {
        (window as any).clarity = clarity;
    }
    (window as any).clarity.decode = decode;
}
