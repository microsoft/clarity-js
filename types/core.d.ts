import { IClarityInfo, IPayload, Token } from "./data";

type TaskFunction = () => Promise<void>;
type TaskResolve = () => void;

/* Helper Interfaces */

export interface IAsyncTask {
    task: TaskFunction;
    resolve: TaskResolve;
}

export interface IBrowserEvent {
    event: string;
    target: EventTarget;
    listener: EventListener;
    capture: boolean;
}

export interface IConfig {
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
    onstart?: (data: IClarityInfo) => void;
    upload?: (data: string, last: boolean) => void;
}

export interface ITaskTiming {
    [key: number]: number;
}
