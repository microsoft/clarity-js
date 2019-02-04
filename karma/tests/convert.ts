import FromArray from "../../src/converters/fromarray";
import ToArray from "../../src/converters/toarray";

import { assert } from "chai";
import { IEvent } from "../../types/core";
import { createMockEvent } from "../setup/mocks/event";

describe("Data Conversion Tests", () => {

    it("validates that conversion works", (done: DoneFn) => {
        let mapObj = {
            country: "USA",
            cities: ["Seattle", "Boston"],
            properties: {
                zoom: 1.5
            }
        };

        let evt: IEvent = createMockEvent();
        evt.state = mapObj;

        let array = ToArray(evt);
        let original = FromArray(array);
        assert.equal(JSON.stringify(evt).length, JSON.stringify(original).length);
        done();
    });

});
