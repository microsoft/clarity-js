export interface ISummary {
    time: number;
    duration: number;
}

export interface IScrollSummary extends ISummary {
    distanceX: number;
    distanceY: number;
}