import { triggerClarityCustomEvent } from "@karma/setup/clarity";
import { cleanupPage, setupPage } from "@karma/setup/page";
import { testAsync } from "@karma/setup/testasync";
import { stopWatching, watch } from "@karma/setup/watch";
import { assert } from "chai";

describe("Core: Custom Event Tests", () => {

    beforeEach(setupPage);
    afterEach(cleanupPage);

    it("validates single key value pair is captured by Clarity", testAsync(async (done: DoneFn) => {
        const testPropValue: string = "testValue";

        watch();
        triggerClarityCustomEvent({ testProp:  testPropValue });

        let events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.testProp, testPropValue);
        done();
    }));

    it("validates multiple key value pairs are captured by Clarity", testAsync(async (done: DoneFn) => {
        const testPropValue1: string = "testValue1";
        const testPropValue2: string = "testValue2";

        watch();
        triggerClarityCustomEvent({ testProp1:  testPropValue1, testProp2: testPropValue2 });

        let events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.testProp1, testPropValue1);
        assert.equal(events[0].state.testProp2, testPropValue2);
        done();
    }));

    it("validates each log generates a separate event", testAsync(async (done: DoneFn) => {
        const testPropValue1: string = "testValue1";
        const testPropValue2: string = "testValue2";

        watch();
        triggerClarityCustomEvent({ testProp:  testPropValue1 });
        triggerClarityCustomEvent({ testProp:  testPropValue2 });

        let events = stopWatching().coreEvents;
        assert.equal(events.length, 2);
        assert.equal(events[0].state.testProp, testPropValue1);
        assert.equal(events[1].state.testProp, testPropValue2);
        done();
    }));

    it("validates nested json is captured", testAsync(async (done: DoneFn) => {
        const testPropValue: string = "testValue1";

        watch();
        triggerClarityCustomEvent({ testProp:  { innerProp: testPropValue} });

        let events = stopWatching().coreEvents;
        assert.equal(events.length, 1);
        assert.equal(events[0].state.testProp.innerProp, testPropValue);
        done();
    }));

});
