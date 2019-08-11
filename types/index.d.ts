import { IConfig } from "./core";

interface IClarityJs {
  version: string;
  start: (config: IConfig) => void;
  end: () => void;
  active: () => boolean;
}

declare const clarity: IClarityJs;

export * from "./data";
export * from "./dom";
export * from "./interactions";
export * from "./metrics";
export * from "./viewport";

export { clarity };
