import { IPayload } from "./data";

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
    cssRules?: boolean;
    tokens?: string[];
    upload?: (data: string) => void;
}

// Task
export const enum Task {
    Discover,
    Mutation,
    Wireup,
    Active
}

export interface ITask {
    [key: number]: number;
}
