export interface IMouse {
    target: number;
    x: number;
    y: number;
    time?: number;
}

export interface IResize {
    width: number;
    height: number;
}

export interface IScroll {
    target: number;
    x: number;
    y: number;
    time?: number;
}

export interface IPageVisibility {
    visible: string;
}

export interface ISelection {
    start: number;
    startOffset: number;
    end: number;
    endOffset: number;
}
