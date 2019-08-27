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
    longtask?: number;
    lookahead?: number;
    distance?: number;
    delay?: number;
    showText?: boolean;
    cssRules?: boolean;
    tokens?: string[];
    url?: string;
    upload?: (data: string) => void;
}

// Task
export const enum Task {
    Discover,
    Mutation,
    Wireup,
    Active
}

export interface ITaskTiming {
    [key: number]: number;
}

export interface IAsyncTask {
    task: TaskFunction;
    callback: TaskCallback;
}
