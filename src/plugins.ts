import layout from "./plugins/layout";
import performance from "./plugins/performance";
import pointer from "./plugins/pointer";
import viewport from "./plugins/viewport";

const classes = { layout, viewport, pointer, performance };

export function plugins(name) {
  return classes[name];
}
