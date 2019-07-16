import { IBindingContainer, IEventBindingPair } from "@clarity-types/clarity";
import deserialize from "@src/data/deserialize";
import * as discover from "@src/dom/discover";
import * as mutation from "@src/dom/mutation";
import * as mouse from "@src/interactions/mouse";
import * as document from "@src/viewport/document";
import * as resize from "@src/viewport/resize";
import * as scroll from "@src/viewport/scroll";
import * as visibility from "@src/viewport/visibility";

let bindings: IBindingContainer;
window["DESERIALIZE"] = deserialize;

/* Initial discovery of DOM */
export function start(): void {
  bindings = {};

  // DOM
  mutation.start();
  discover.start();

  // Viewport
  document.start();
  resize.start();
  visibility.start();
  scroll.start();

  // Pointer
  mouse.start();

}

export function time(): number {
  return Math.round(performance.now());
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

export function end(): void {
  // Walk through existing list of bindings and remove them all
  for (let evt in bindings) {
    if (bindings.hasOwnProperty(evt)) {
      let eventBindings = bindings[evt] as IEventBindingPair[];
      for (let i = 0; i < eventBindings.length; i++) {
        (eventBindings[i].target).removeEventListener(evt, eventBindings[i].listener);
      }
    }
  }

  mutation.end();
}

start();
