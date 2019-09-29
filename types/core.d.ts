import { ClarityInfo, Payload, Token } from "./data";

type TaskFunction = () => Promise<void>;
type TaskResolve = () => void;

/* Helper Interfaces */

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
    cssRules?: boolean;
    lean?: boolean;
    tokens?: string[];
    url?: string;
    onstart?: (data: ClarityInfo) => void;
    upload?: (data: string, last: boolean) => void;
}

export interface TaskTiming {
    [key: number]: number;
}
