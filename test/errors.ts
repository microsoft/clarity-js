import { InstrumentationEventName } from "../src/instrumentation";
import { activateCore, cleanupFixture, getAllSentEvents, setupFixture } from "./utils";

import * as chai from "chai";
import "../src/errors";

let assert = chai.assert;

describe("Error Tests", () => {
    beforeEach(setupFixture);
    afterEach(cleanupFixture);

    it("checks that unhandled exceptions are logged", (done) => {
        activateCore();
        let syntheticEvent = document.createEvent("Event");
        syntheticEvent.initEvent("error", true, true);
        syntheticEvent["message"] = "sample error text";
        document.dispatchEvent(syntheticEvent);
        
        let events = getAllSentEvents();
        
        assert.equal(events.length, 1);
        assert.equal(events[0].type, InstrumentationEventName);
        assert.equal(events[0].state.type, Instrumentation.JsError);
        done();
        }
    );
});
