import { Config } from "./core";

interface Clarity {
  version: string;
  config: (config?: Config) => boolean;
  start: (config?: Config) => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  active: () => boolean;
  tag: (key: string, value: string) => void;
}

declare const clarity: Clarity;

export * from "./data";
export * from "./diagnostic";
export * from "./layout";
export * from "./interaction";
export * from "./decode";

export { clarity };
