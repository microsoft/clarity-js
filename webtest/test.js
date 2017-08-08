var webdriver = require("selenium-webdriver");
var fs = require('fs');

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


var getClarityCode = function (clarityContents) {
  console.log("before inject");  
  console.log("contents " + clarityContents.substring(0,20));

  var script = document.createElement('script');
  var head = document.getElementsByTagName('head')[0];

  script.innerHTML = clarityContents;
  head.appendChild(script);
  console.log("appended " + script.innerHTML.substring(0,100));
}

var verifyClarityCode = function () {
  if(typeof(logError) == "undefined") {
    console.log("logError undefined");
  } else {
    console.log("logError there!");
  }
}

var clarityResource = "/home/travis/build/Microsoft/clarity-js/build/clarity.min.js";
var clarityContents = fs.readFileSync(clarityResource,'utf8');

driver.executeScript(getClarityCode, clarityContents);
driver.executeScript(verifyClarityCode);

driver.quit();
