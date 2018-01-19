import FromArray from "../converters/fromarray";
import schemas from "../converters/schema";
import ToArray from "../converters/toarray";
import { IEvent } from "../declarations/clarity";

import * as chai from "chai";
let assert = chai.assert;

describe("Core Tests", () => {

  it("validates that conversion works", (done: DoneFn) => {
    let mapObj = {
      country: "USA",
      cities: ["Seattle", "Boston"],
      properties: {
        zoom: 1.5
      }
    };

    let evt: IEvent = {
      id: -1,
      origin: -1,
      type: -1,
      time: -1,
      data: mapObj
    };

    let schema = schemas.createSchema(mapObj);
    let array = ToArray(evt);
    let original = FromArray(array);
    assert.equal(JSON.stringify(evt).length, JSON.stringify(original).length);

    done();
  });

});
