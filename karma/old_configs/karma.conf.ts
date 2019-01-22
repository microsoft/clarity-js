export = (config) => {
  config.set({
    basePath: "..",
    autoWatch: true,
    frameworks: ["chai", "detectBrowsers", "fixture", "browserify", "jasmine"],
    files: [
      "test/clarity.fixture.html",
      "../package.json",
      {
        pattern: "test/**/*.js"
      },
    ],
    plugins: [
      "karma-chai",
      "karma-chrome-launcher",
      "karma-edge-launcher",
      "karma-firefox-launcher",
      "karma-ie-launcher",
      "karma-safari-launcher",
      "karma-detect-browsers",
      "karma-fixture",
      "karma-html2js-preprocessor",
      "karma-browserify",
      "karma-jasmine",
      "karma-json-fixtures-preprocessor"
    ],
    browsers: ["Chrome"],
    detectBrowsers: {
      enabled: true,
      usePhantomJS: false
    },
    singleRun: true,
    preprocessors: {
      "test/*.js": ["browserify"],
      "test/*.html": ["html2js"],
      "../**/*.json": ["json_fixtures"]
    },
    jsonFixturesPreprocessor: {
      // Strip full file system part from the file path / fixture name
      stripPrefix: ".+/",
      // Change the global fixtures variable name
      variableName: "__test_jsons"
    },
    reporters: ["dots"]
  });
};
