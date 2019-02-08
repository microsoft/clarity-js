import { publishAsync, PubSubEvents } from "@karma/setup/pubsub";

let _MutationObserver: typeof MutationObserver = null;

export const installMutationObserverProxy = () => {
    if (_MutationObserver === null) {
        _MutationObserver = MutationObserver;
    }
    MutationObserver = ((callback: MutationCallback) => {
        return new _MutationObserver(
            (mutationList, observer) => {
                callback(mutationList, observer);
                publishAsync(PubSubEvents.MUTATION, null);
            }
        );
    }) as any as typeof MutationObserver;
};

export const uninstallMutationObserverProxy = () => {
    if (_MutationObserver !== null) {
        MutationObserver = _MutationObserver;
        _MutationObserver = null;
    }
};
