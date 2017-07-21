import customdata from "./plugins/customdata";
import errors from "./plugins/errors";
import layout from "./plugins/layout";
import performance from "./plugins/performance";
import pointer from "./plugins/pointer";
import viewport from "./plugins/viewport";

const classes = { layout, viewport, pointer, performance, errors, customdata };

export default function getPlugin(name: string) {
  return classes[name];
}
