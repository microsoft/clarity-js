// There is a known issue where an (assertion) error within an async test doesn't cause the test to fail
// Instead, it causes a test timeout. Wrapping async test function with the code below lets us fail test
// immediately on (assertion) error, although stack trace and error message are altered slightly
// https://github.com/mochajs/mocha/issues/1128
export function testAsync(testFn: (done: DoneFn) => Promise<void>) {
    return (done: DoneFn) => {
        testFn(done).catch(done);
    };
}
