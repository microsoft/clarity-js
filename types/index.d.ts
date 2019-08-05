interface IClarityJs {
  version: string;
  start: () => void;
  end: () => void;
}

declare const ClarityJs: IClarityJs;

export * from "./data";
export * from "./dom";
export * from "./metrics";

export { ClarityJs };
