export = (config) => {
  config.set({
    basePath: "..",
    autoWatch: true,
    frameworks: ["mocha", "chai", "fixture", "browserify", "jasmine"],
    files: [
      "test/clarity.fixture.html",
      {
        pattern: "test/**/*.js"
      }
    ],
    plugins: [
      "karma-mocha",
      "karma-chai",
      "karma-coverage",
      "karma-phantomjs-launcher",
      "karma-fixture",
      "karma-html2js-preprocessor",
      "karma-browserify",
      "karma-jasmine"
    ],

    browsers: ["PhantomJS"],

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
