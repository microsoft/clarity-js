"use strict";
module.exports = function (config) {
    config.set({

        basePath: "..",

        frameworks: ["karma-typescript", "fixture", "jasmine"],

        files: [
            { pattern: "karma/fixtures/**/*.html" },
            { pattern: "package.json" },
            { pattern: "src/**/*.ts" },
            { pattern: "karma/setup/**/*.ts" },
            { pattern: "karma/tests/**/*.ts" },
        ],

        preprocessors: {
            "**/*.ts": ["karma-typescript"],
            "**/*.html": ["html2js"],
            "**/*.json": ["json_fixtures"]
        },

        jsonFixturesPreprocessor: {
            // Strip full file system part from the file path / fixture name
            stripPrefix: ".+/",
            // Change the global fixtures variable name
            variableName: "__test_jsons"
          },

        reporters: ["progress"],

        browsers: ["ChromeHeadless"],

        customLaunchers: {
            ChromeHeadless: {
                base: "Chrome",
                flags: [
                    "--headless",
                    "--disable-gpu",
                    "--no-sandbox",
                    // Without a remote debugging port, Google Chrome exits immediately.
                    "--remote-debugging-port=9222"
                ]
            }
        },
        
        singleRun: true
    });
};
