/* Event Data */

export interface IScriptErrorData {
    source: string;
    message: string;
    line: number;
    column: number;
    stack: string;
}

export interface IBrokenImageData {
    source: string;
    target: number;
}
