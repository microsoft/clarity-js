import { IConfig } from "./core";

interface IClarityJs {
  version: string;
  start: (config: IConfig) => void;
  end: () => void;
  active: () => boolean;
}

declare const clarity: IClarityJs;

export * from "./data";
export * from "./diagnostic";
export * from "./dom";
export * from "./interaction";
export * from "./metric";

export { clarity };
