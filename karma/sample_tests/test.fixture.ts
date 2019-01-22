import { cleanupFixture, setupFixture } from "../setup/testsetup";

describe("Karma fixture tests", (): void => {

    beforeEach(() => {
        setupFixture(["errors"]);
    });

    afterEach(cleanupFixture);

    it("Test that fixture is wired up", (done: DoneFn) => {
        const backup = document.getElementById("backup");
        console.log(backup);
        done();
    });
});
