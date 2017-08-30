export = (config) => {
  config.set({
    basePath: "..",
    autoWatch: true,
    frameworks: ["chai", "fixture", "browserify", "jasmine"],
    files: [
      "test/clarity.fixture.html",
      {
        pattern: "test/**/*.js"
      }
    ],
    plugins: [
      "karma-chai",
      "karma-coverage",
      "karma-chrome-launcher",
      "karma-fixture",
      "karma-html2js-preprocessor",
      "karma-browserify",
      "karma-jasmine"
    ],
    browsers: ["ChromeHeadless"],
    customLaunchers: {
      ChromeHeadless: {
        base: "Chrome",
        flags: [
          "--headless",
          "--disable-gpu",
          "--no-sandbox",
          // Without a remote debugging port, Google Chrome exits immediately.
          "--remote-debugging-port=9222",
        ],
      }
    },
    reporters: ["progress", "coverage"],
    preprocessors: {
      "src/*.js": ["coverage"],
      "test/*.js": ["browserify"],
      "test/*.html": ["html2js"]
    },
    singleRun: true,
    coverageReporter: {
      dir: "coverage/",
      reporters: [
        { type: "html", subdir: "html" },
        { type: "lcovonly", subdir: "lcov" },
        { type: "cobertura", subdir: "cobertura" }
      ]
    }
  });
};
