export = (config) => {
  config.set({

    frameworks: ["jasmine", "karma-typescript"],

    files: [
      { pattern: "tests/**/*.ts" }
    ],

    preprocessors: {
      "**/*.ts": ["karma-typescript"]
    },

    reporters: ["dots", "karma-typescript"],

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
        ]
      }
    },

    singleRun: true
  });
};
