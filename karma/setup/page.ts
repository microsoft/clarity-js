import { IConfig } from "@clarity-types/config";
import { IStartClarityOptions, startClarity, stopClarity } from "./clarity";
import { installEventListenerProxies, uninstallEventListenerProxies } from "./proxyapis/eventlistener";
import { installJasmineClock, uninstallJasmineClock } from "./proxyapis/jasmineclock";
import { installMutationObserverProxy, uninstallMutationObserverProxy } from "./proxyapis/mutationobserver";
import { installPerformanceProxy, uninstallPerformanceProxy } from "./proxyapis/performance";
import { installWorkerProxy, uninstallWorkerProxy } from "./proxyapis/worker";
import { revokeAllMessages, unsubscribeAll } from "./pubsub";
import { stopWatching } from "./watch";

export async function setupPage(done: DoneFn, _config?: IConfig, _startOptions?: IStartClarityOptions): Promise<void> {
    setupPageHelper();
    await startClarity(_config, _startOptions);
    done();
}

export function cleanupPage(): void {
    stopWatching();
    stopClarity();

    // Uninstall API proxies
    uninstallJasmineClock();
    uninstallMutationObserverProxy();
    uninstallEventListenerProxies();
    uninstallWorkerProxy();
    uninstallPerformanceProxy();

    // Reset PubSub
    unsubscribeAll();
    revokeAllMessages();

    fixture.cleanup();
}

export async function setupPageNoRunClarity(done: DoneFn): Promise<void> {
    setupPageHelper();
    done();
}

function setupPageHelper(): void {
    // Relative to karma config location
    fixture.setBase("karma/fixtures");
    fixture.load("clarity.fixture.html");

    // Install API proxies
    installJasmineClock();
    installMutationObserverProxy();
    installEventListenerProxies();
    installWorkerProxy();
    installPerformanceProxy();
}
