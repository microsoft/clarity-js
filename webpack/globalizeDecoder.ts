import * as decode from "@decode/clarity";

// When built with webpack for prod, compiled decode-js bundle doesn't expose the module anywhere on the page.
// Since we need decode-js to be available globally, we can create a wrapper module that would assign clarity to window.
if (typeof window !== "undefined") {
    (window as any).decode = decode;
}
