import deserialize from "./data/deserialize";
import serialize from "./data/send";
import discover from "./dom/discover";
import mutation from "./dom/mutation";

window["SERIALIZE"] = serialize;
window["DESERIALIZE"] = deserialize;

/* Initial discovery of DOM */
export function init(): void {
  mutation();
  discover().then(() => {
    // DEBUG: Remove later
    console.log("done discovery!");
    console.log(window["TRACKER"]["dt"]["duration"] + "ms in " + window["TRACKER"]["dt"]["count"] + " iterations");
    // DEBUG: Serialize DOM
    serialize().then((output: string) => {
      console.log("Serialized DOM: " + output);
      console.log("Serialized DOM Length: " + output.length);
      console.log("done serialization!");
      console.log(window["TRACKER"]["st"]["duration"] + "ms in " + window["TRACKER"]["st"]["count"] + " iterations");
      console.log("====================");
      let deserialized = deserialize(output);
      console.log("Deserialized DOM: " + deserialized);
      console.log("Deserialized DOM Length: " + deserialized.length);
    });
  });
}
