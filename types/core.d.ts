export interface IEventBindingPair {
    target: EventTarget;
    listener: EventListener;
}

export interface IBindingContainer {
    [key: string]: IEventBindingPair[];
}

export interface IConfig {
    /* Core */
    longtask: number;
    /* Interactions */
    // Each interaction is going to wait until the specified milliseconds below before marking the end of interaction
    lookahead: number;
    distance: number;
    /* Data */
    // Each new event is going to delay data upload to server by this number of milliseconds
    delay: number;
    // Pointer to the function which would be responsible for sending the data
    // If left unspecified, raw payloads will be uploaded to the upload url endpoint
    upload: () => void;
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
