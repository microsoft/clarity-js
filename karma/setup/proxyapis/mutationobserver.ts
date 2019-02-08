import { publishAsync, PubSubEvents } from "@karma/setup/pubsub";

let _MutationObserver: typeof MutationObserver = null;

export const installMutationObserverProxy = (): void => {
    if (_MutationObserver === null) {
        _MutationObserver = MutationObserver;
    }
    MutationObserver = ((callback: MutationCallback): typeof MutationObserver => {
        return new _MutationObserver(
            (mutations: MutationRecord[], observer: MutationObserver): void => {
                callback(mutations, observer);
                publishAsync(PubSubEvents.MUTATION, null);
            }
        ) as any as typeof MutationObserver;
    }) as any as typeof MutationObserver;
};

export const uninstallMutationObserverProxy = (): void => {
    if (_MutationObserver !== null) {
        MutationObserver = _MutationObserver;
        _MutationObserver = null;
    }
};
