import encode from "./encode";

export function compute(): string {
    return JSON.stringify(encode());
}
