import { ClarityInfo, Payload, Token } from "./data";

type TaskFunction = () => Promise<void>;
type TaskResolve = () => void;

/* Enum */

export const enum Priority {
    Normal = 0,
    High = 1
}

/* Helper Interfaces */

export interface TaskTracker {
    [key: number]: TaskInfo;
}

export interface TaskInfo {
    start: number;
    calls: number;
    yield: number;
}

export interface RequestIdleCallbackOptions {
    timeout: number;
}

export interface RequestIdleCallbackDeadline {
    didTimeout: boolean;
    timeRemaining: (() => number);
}

export interface AsyncTask {
    task: TaskFunction;
    resolve: TaskResolve;
}

export interface BrowserEvent {
    event: string;
    target: EventTarget;
    listener: EventListener;
    capture: boolean;
}

export interface Config {
    projectId?: string;
    longtask?: number;
    lookahead?: number;
    distance?: number;
    interval?: number;
    delay?: number;
    expire?: number;
    ping?: number;
    timeout?: number;
    session?: number;
    shutdown?: number;
    cssRules?: boolean;
    lean?: boolean;
    track?: boolean;
    tokens?: string[];
    url?: string;
    onstart?: (data: ClarityInfo) => void;
    upload?: (data: string, sequence?: number, last?: boolean) => void;
}
