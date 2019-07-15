import { IBindingContainer, IEventBindingPair } from "@clarity-types/core";
import deserialize from "@src/data/deserialize";
import discover from "@src/dom/discover";
import mutation from "@src/dom/mutation";

let bindings: IBindingContainer;
window["DESERIALIZE"] = deserialize;

/* Initial discovery of DOM */
export function init(): void {
  bindings = {};
  mutation();
  discover();
}

export function time(): number {
  return performance.now();
}

export function bind(target: EventTarget, event: string, listener: EventListener): void {
  let eventBindings = bindings[event] || [];
  target.addEventListener(event, listener, false);
  eventBindings.push({
    target,
    listener
  });
  bindings[event] = eventBindings;
}

export function teardown(): void {
  // Walk through existing list of bindings and remove them all
  for (let evt in bindings) {
    if (bindings.hasOwnProperty(evt)) {
      let eventBindings = bindings[evt] as IEventBindingPair[];
      for (let i = 0; i < eventBindings.length; i++) {
        (eventBindings[i].target).removeEventListener(evt, eventBindings[i].listener);
      }
    }
  }
}
