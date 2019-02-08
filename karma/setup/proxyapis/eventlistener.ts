import { publishAsync, PubSubEvents } from "@karma/setup/pubsub";

let _addEventListener: typeof Node.prototype.addEventListener = null;
let _removeEventListener: typeof Node.prototype.removeEventListener = null;

const CLARITY_TEST_PROXY_LISTENER_ATTRIBUTE = "CLARITY_TEST_PROXY_LISTENER";

export function installEventListenerProxies() {
    installAddEventListenerProxy();
    installRemoveEventListenerProxy();
}

export function uninstallEventListenerProxies() {
    uninstallAddEventListenerProxy();
    uninstallRemoveEventListenerProxy();
}

function installAddEventListenerProxy() {
    if (_addEventListener === null) {
        _addEventListener = Node.prototype.addEventListener;
    }
    function proxyAddEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
    ): void {
        let proxyListener = (evt: Event): void => {
            if (listener) {
                (listener as EventListenerObject).handleEvent
                ? (listener as EventListenerObject).handleEvent(evt)
                : (listener as EventListener)(evt);
            }
            publishAsync(getTopicFromEventType(evt.type), null);
        };
        proxyListener = listener[CLARITY_TEST_PROXY_LISTENER_ATTRIBUTE] || proxyListener;
        listener[CLARITY_TEST_PROXY_LISTENER_ATTRIBUTE] = proxyListener;

        _addEventListener.call(this, type, proxyListener, options);
    }
    Node.prototype.addEventListener = proxyAddEventListener;
}

function installRemoveEventListenerProxy() {
    if (_removeEventListener === null) {
        _removeEventListener = Node.prototype.removeEventListener;
    }
    function proxyRemoveEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
    ): void {
        const proxyListener = listener[CLARITY_TEST_PROXY_LISTENER_ATTRIBUTE] || listener;
        _removeEventListener.call(this, type, proxyListener, options);
    }
    Node.prototype.removeEventListener = proxyRemoveEventListener;
}

function uninstallAddEventListenerProxy() {
    if (_addEventListener !== null) {
        Node.prototype.addEventListener = _addEventListener;
        _addEventListener = null;
    }
}

function uninstallRemoveEventListenerProxy() {
    if (_removeEventListener !== null) {
        Node.prototype.removeEventListener = _removeEventListener;
        _removeEventListener = null;
    }
}

function getTopicFromEventType(type: string): PubSubEvents {
    switch (type) {
        case "click":
            return PubSubEvents.CLICK;
        case "scroll":
            return PubSubEvents.SCROLL;
        case "input":
            return PubSubEvents.INPUT;
        case "change":
            return PubSubEvents.CHANGE;
        default:
            return PubSubEvents.UNKNOWN;
    }
}
