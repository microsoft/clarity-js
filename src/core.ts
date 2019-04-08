import discover from "./dom/discover";

/* Initial discovery of DOM */
export function init(): void {
  discover().then(() => {
    // DEBUG: Remove later
    console.log("done discovery!");
    console.log(window["TRACKER"][0]["duration"] + "ms in " + window["TRACKER"][0]["count"] + " iterations");
  });
}
