var webdriver = require("selenium-webdriver");

var username = "ender336";
var accessKey = "fcfad206-6db2-46bc-8824-c1e576d549cf";
var driver = new webdriver.Builder().
  withCapabilities({
    'browserName': 'chrome',
    'platform': 'Windows XP',
    'version': '43.0',
    'username': username,
    'accessKey': accessKey
  }).
  usingServer("http://" + username + ":" + accessKey +
              "@ondemand.saucelabs.com:80/wd/hub").
build();


driver.get("http://www.bing.com/search?q=test");
driver.getTitle().then((title) => {
    console.log("title is: " + title);
});
console.log("hi sam");
driver.quit();
