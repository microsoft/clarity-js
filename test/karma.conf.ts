export = (config) => {
  config.set({
    basePath: "..",
    autoWatch: true,
    frameworks: ["mocha", "chai", "detectBrowsers", "fixture", "browserify", "jasmine"],
    files: [
      "test/clarity.fixture.html",
      {
        pattern: "test/**/*.js"
      }
    ],
    plugins: [
      "karma-mocha",
      "karma-chai",
      "karma-chrome-launcher",
      "karma-firefox-launcher",
      "karma-ie-launcher",
      "karma-safari-launcher",
      "karma-detect-browsers",
      "karma-fixture",
      "karma-html2js-preprocessor",
      "karma-browserify",
      "karma-jasmine"
    ],
    browsers: ["ChromeNoSandbox"],
    customLaunchers: {
      ChromeNoSandbox: {
        base: "Chrome",
        flags: ["--no-sandbox"]
      }
    },
    detectBrowsers: {
      enabled: true,
      usePhantomJS: false,
      postDetection: (availableBrowsers: string[]) => {
        // Switch Chrome to ChromeNoSandbox
        let i = availableBrowsers.indexOf("Chrome");
        if (i > -1) {
          availableBrowsers[i] = "ChromeNoSandbox";
        }
        return availableBrowsers;
      }
    },
    singleRun: true,
    preprocessors: {
      "test/*.js": ["browserify"],
      "test/*.html": ["html2js"]
    },
    reporters: ["dots"]
  });
};
