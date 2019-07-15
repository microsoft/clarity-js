// @ts-ignore: 'merge' implicityly has 'any' type. There are no typings for 'merge'
import * as merge from "merge";

import { Instrumentation } from "@clarity-types/instrumentation";
import { MockErrorInit, MockErrorMessage } from "@karma/setup/mocks/error";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

describe("Error Tests", () => {

    let jasmineErrorHandler: GlobalEventHandlers["onerror"] = null;

    function preventDefault(e: Event): void {
        e.preventDefault();
    }

    beforeEach((done: DoneFn) => {
        setupPage(done, ({ instrument: true }));
        jasmineErrorHandler = window.onerror;
        window.onerror = null;
        window.addEventListener("error", preventDefault);
    });
    afterEach(() => {
        window.removeEventListener("error", preventDefault);
        window.onerror = jasmineErrorHandler;
        cleanupPage();
    });

    it("checks that a single error event is logged", (done: DoneFn) => {
        watch();
        throwError(MockErrorMessage);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.type, Instrumentation.JsError);
        assert.equal(events[0].state.message, MockErrorMessage);
        assert.equal(events[0].state.source, MockErrorInit.filename);
        assert.equal(events[0].state.lineno, MockErrorInit.lineno);
        assert.equal(events[0].state.colno, MockErrorInit.colno);
        done();
    });

    it("checks empty message when not passed", (done: DoneFn) => {
        watch();
        throwError();

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.type, Instrumentation.JsError);
        assert.equal(events[0].state.message, "undefined");
        assert.equal(events[0].state.source, MockErrorInit.filename);
        assert.equal(events[0].state.lineno, MockErrorInit.lineno);
        assert.equal(events[0].state.colno, MockErrorInit.colno);
        done();
    });

    it("checks that multiple error events are logged", (done: DoneFn) => {
        const secondMockErrorMessage = "SecondMockErrorMessage";
        watch();
        throwError(MockErrorMessage);
        throwError(secondMockErrorMessage);

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 2);
        assert.equal(events[0].state.type, Instrumentation.JsError);
        assert.equal(events[0].state.message, MockErrorMessage);
        assert.equal(events[1].state.type, Instrumentation.JsError);
        assert.equal(events[1].state.message, secondMockErrorMessage);
        done();
    });

    it("checks that error event's message is logged, when error object is not provided", (done: DoneFn) => {
        watch();
        throwError(null, { error: null });

        const events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.type, Instrumentation.JsError);
        assert.equal(events[0].state.message, MockErrorInit.message);
        done();
    });

    function throwError(errMessage?: string, errEventInit?: ErrorEventInit): void {
        const errInit = merge(true, MockErrorInit, errEventInit);
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.innerText = `
            (function() {
                var errInit = ${JSON.stringify(errInit)};
                if (!("error" in errInit)) {
                    errInit.error = new Error("${errMessage}");
                }
                var errEvt = new ErrorEvent("error", errInit);
                window.dispatchEvent(errEvt);
            }());
        `;
        document.body.appendChild(script);
    }

});
