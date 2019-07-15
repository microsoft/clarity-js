export interface IResizeViewport {
    width: number;
    height: number;
    updated: boolean;
}

export interface IScrollViewport {
    time: number;
    x: number;
    y: number;
    updated: boolean;
}

export interface IDocumentSize {
    width: number;
    height: number;
    updated: boolean;
}

export interface IPageVisibility {
    visible: string;
    updated: boolean;
}
