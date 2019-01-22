"use strict";
module.exports = function (config) {
    config.set({

        frameworks: ["karma-typescript", "fixture", "jasmine"],

        files: [
            { pattern: "karma/fixtures/**/*.html" },
            { pattern: "karma/fixtures/**/*.json" },
            { pattern: "src/**/*.ts" },
            { pattern: "karma/setup/**/*.ts" },
            { pattern: "karma/tests/**/*.ts" },
        ],

        preprocessors: {
            "**/*.ts": ["karma-typescript"],
            "**/*.html": ["html2js"],
            "**/*.json": ["json_fixtures"]
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
                    "--remote-debugging-port=9222"
                ]
            }
        },
        
        singleRun: true
    });
};
