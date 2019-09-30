import { Payload } from "../data";
import { DecodedPayload } from "./decode";

interface Decode {
    decode: (data: string) => DecodedPayload;
}

declare const decode: Decode;

export * from "./data";
export * from "./decode";
export * from "./diagnostic";
export * from "./layout";
export * from "./interaction";

export { decode };
