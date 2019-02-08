const w: any = window;
const _setTimeout = window.setTimeout;
const _clearTimeout = window.clearTimeout;

export function installJasmineClock(): void {
    jasmine.clock().install();
}

export function uninstallJasmineClock(): void {
    jasmine.clock().uninstall();
}

export const setRealTimeout: typeof window.setTimeout = (...args: any[]): number => {
    w._setTimeout = _setTimeout;
    const retval = w._setTimeout(...args);
    delete w._setTimeout;
    return retval;
};

export const clearRealTimeout: typeof window.clearTimeout = (...args: any[]): void => {
    w._clearTimeout = _clearTimeout;
    w._clearTimeout(...args);
    delete w._clearTimeout;
};
