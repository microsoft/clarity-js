// We send back all properties from performance.timing object
export type IPerformanceTiming = PerformanceTiming;

export interface IPerformanceTimingState {
  timing: IPerformanceTiming;
}

export interface IPerformanceResourceTimingState {
  duration: number;
  initiatorType: string;
  startTime: number;
  connectStart: number;
  connectEnd: number;
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  name: string;
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
  protocol?: string;
}
