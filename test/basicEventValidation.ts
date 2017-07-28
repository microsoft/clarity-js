import * as webdriver from "selenium-webdriver";
import * as core from "../src/core";
import { activateCore, cleanupFixture, setupFixture } from "./utils";

let username = "ender336";
let accessKey = "fcfad206-6db2-46bc-8824-c1e576d549cf";
let driver = new webdriver.Builder().
  /*withCapabilities({
    'browserName': 'chrome',
    'platform': 'Windows XP',
    'version': '43.0',
    'username': username,
    'accessKey': accessKey
  }).
  usingServer("http://" + username + ":" + accessKey +
              "@ondemand.saucelabs.com:80/wd/hub").*/
  build();

describe("Basic WebDriver Tests", () => {

  beforeEach(setupFixture);
  afterEach(cleanupFixture);

  it("make sure we can call sauce", (done) => {
    core.teardown();
    driver.get("http://www.bing.com/search?q=test");
    driver.getTitle().then((title) => {
        console.log("title is: " + title);
    });
    driver.log("hi sam");
    driver.quit();
    done();
  });
});