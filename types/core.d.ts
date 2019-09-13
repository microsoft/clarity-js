import { IClarityData, IPayload, Token } from "./data";

type TaskFunction = () => Promise<void>;
type TaskResolve = () => void;

export interface IEventBindingPair {
    target: EventTarget;
    listener: EventListener;
}

export interface IBindingContainer {
    [key: string]: IEventBindingPair[];
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
    onstart?: (data: IClarityData) => void;
    upload?: (data: string, last: boolean) => void;
}

export interface ITaskTracker {
    [key: number]: number;
}

export interface IAsyncTask {
    task: TaskFunction;
    resolve: TaskResolve;
}
