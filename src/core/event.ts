import { BrowserEvent } from "@clarity-types/core";
import wrap from "./wrap";

let bindings: BrowserEvent[] = [];

export function bind(target: EventTarget, event: string, listener: EventListener, capture: boolean = false): void {
    listener = wrap(listener) as EventListener;
    target.addEventListener(event, listener, capture);
    bindings.push({ event, target, listener, capture });
}

export function reset(): void {
  // Walk through existing list of bindings and remove them all
  for (let binding of bindings) {
    (binding.target).removeEventListener(binding.event, binding.listener, binding.capture);
  }
  bindings = [];
}
