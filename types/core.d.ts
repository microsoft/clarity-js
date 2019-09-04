import { IPayload, Token } from "./data";

type TaskFunction = () => Promise<Token[]>;
type TaskCallback = (data: Token[]) => void;

export interface IEventBindingPair {
    target: EventTarget;
    listener: EventListener;
}

export interface IBindingContainer {
    [key: string]: IEventBindingPair[];
}

export interface IConfig {
    pageId?: string;
    userId?: string;
    projectId?: string;
    longTask?: number;
    lookahead?: number;
    distance?: number;
    interval?: number;
    delay?: number;
    cssRules?: boolean;
    thrift?: boolean;
    tokens?: string[];
    url?: string;
    upload?: (data: string) => void;
}

export interface ITaskTracker {
    [key: number]: number;
}

export interface IAsyncTask {
    task: TaskFunction;
    callback: TaskCallback;
}
