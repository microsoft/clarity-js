import { IConfig } from "./core";

interface IClarityJs {
  version: string;
  config: (config?: IConfig) => boolean;
  start: (config?: IConfig) => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  active: () => boolean;
  tag: (key: string, value: string) => void;
}

declare const clarity: IClarityJs;

export * from "./data";
export * from "./diagnostic";
export * from "./layout";
export * from "./interaction";
export * from "./decode";

export { clarity };
