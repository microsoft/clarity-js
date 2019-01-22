import { EXPORT_FROM_TEST_ONE } from "./test";

describe("Karma testsV2", (): void => {
    it("TestV2", (done: DoneFn) => {
        console.log(EXPORT_FROM_TEST_ONE);
        done();
    });
});
