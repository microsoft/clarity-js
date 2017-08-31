import compress from "../src/compress";
import { cleanupFixture, setupFixture } from "./testsetup";
import uncompress from "./uncompress";

let assert = chai.assert;

describe("Data Compression Tests", () => {
  it("should validate that compression works", () => {
    let str = "This is a string with some repetitions in the string.";
    str += str;
    str += str;
    let compressed = compress(str);
    let uncompressed = uncompress(compressed);
    assert.equal(compressed.length > 0 && compressed.length < str.length, true);
    assert.equal(compressed === str, false);
    assert.equal(uncompressed === str, true);
  });
});
