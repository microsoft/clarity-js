// import * as webdriver from "selenium-webdriver";

var webdriver = require("selenium-webdriver");

var username = "ender336";
var accessKey = "fcfad206-6db2-46bc-8824-c1e576d549cf";
var driver = new webdriver.Builder().
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

describe("Basic WebDriver Tests", function () {

  it("make sure we can call sauce", function (done) {
    driver.get("http://www.bing.com/search?q=test");
    driver.getTitle().then((title) => {
        console.log("title is: " + title);
    });
    driver.log("hi sam");
    driver.quit();
    done();
  });
});
