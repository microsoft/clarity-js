import errors from "./plugins/errors";
import layout from "./plugins/layout/layout";
import performance from "./plugins/performance";
import pointer from "./plugins/pointer/pointer";
import viewport from "./plugins/viewport";

type ClarityPlugin = typeof errors | typeof layout | typeof performance | typeof pointer | typeof viewport;

const classes: { [key: string]: ClarityPlugin } = {
  layout,
  viewport,
  pointer,
  performance,
  errors
};

export default function getPlugin(name: string): ClarityPlugin {
  return classes[name];
}
