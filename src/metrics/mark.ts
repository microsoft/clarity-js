import {IMark, Mark } from "@clarity-types/metrics";

export let data: IMark[] = [];

export function mark(key: Mark, tag: string, start: number, end: number = 0): void {
    end = end > 0 ? end : start;
    data.push( { mark: tag, start, end});
}
