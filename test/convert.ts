import { IEvent } from "../clarity";
import FromArray from "../converters/fromarray";
import schemas from "../converters/schema";
import ToArray from "../converters/toarray";

import * as chai from "chai";
import { getMockEvent } from "./utils";
let assert = chai.assert;

describe("Data Conversion Tests", () => {

  it("validates that conversion works", (done: DoneFn) => {
    let mapObj = {
      country: "USA",
      cities: ["Seattle", "Boston"],
      properties: {
        zoom: 1.5
      }
    };

    let evt: IEvent = getMockEvent();
    evt.state = mapObj;

    let schema = schemas.createSchema(mapObj);
    let array = ToArray(evt);
    let original = FromArray(array);
    assert.equal(JSON.stringify(evt).length, JSON.stringify(original).length);

    done();
  });

});
