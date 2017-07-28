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
    excluse: ["test/basicEventValidation.js"],
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
    detectBrowsers: {
      enabled: true,
      usePhantomJS: false
    },
    singleRun: true,
    preprocessors: {
      "test/*.js": ["browserify"],
      "test/*.html": ["html2js"]
    },
    reporters: ["dots"]
  });
};
