import discover from "./dom/discover";
import serialize from "./dom/serialize";

/* Initial discovery of DOM */
export function init(): void {
  discover().then(() => {
    // DEBUG: Remove later
    console.log("done discovery!");
    console.log(window["TRACKER"][0]["duration"] + "ms in " + window["TRACKER"][0]["count"] + " iterations");
    // DEBUG: Serialize DOM
    console.log("Serialized DOM: " + serialize(document.documentElement));
  });
}
