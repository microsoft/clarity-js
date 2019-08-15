export interface IScriptError {
    source: string;
    message: string;
    line: number;
    column: number;
    stack: string;
}

export interface IImageError {
    source: string;
    target: number;
}
