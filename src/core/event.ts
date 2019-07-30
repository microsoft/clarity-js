import { IBindingContainer, IEventBindingPair } from "@clarity-types/clarity";

let bindings: IBindingContainer = {};

export function bind(target: EventTarget, event: string, listener: EventListener): void {
    let eventBindings = bindings[event] || [];
    target.addEventListener(event, listener, false);
    eventBindings.push({
      target,
      listener
    });
    bindings[event] = eventBindings;
}

export function reset(): void {
  // Walk through existing list of bindings and remove them all
  for (let evt in bindings) {
    if (bindings.hasOwnProperty(evt)) {
      let eventBindings = bindings[evt] as IEventBindingPair[];
      for (let i = 0; i < eventBindings.length; i++) {
        (eventBindings[i].target).removeEventListener(evt, eventBindings[i].listener);
      }
    }
  }
  bindings = {};
}
