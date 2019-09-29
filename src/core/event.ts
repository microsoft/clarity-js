import { IBrowserEvent } from "@clarity-types/core";

let bindings: IBrowserEvent[] = [];

export function bind(target: EventTarget, event: string, listener: EventListener, capture: boolean = false): void {
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
