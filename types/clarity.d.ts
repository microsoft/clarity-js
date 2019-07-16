export interface IEventBindingPair {
  target: EventTarget;
  listener: EventListener;
}

export interface IBindingContainer {
  [key: string]: IEventBindingPair[];
}
