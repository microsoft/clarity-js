"use strict";
module.exports = function (config) {
    config.set({

        // Base path that will be used to resolve all patterns (eg. files, exclude).
        basePath: "../..",

        // Frameworks to use.
        // Available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ["karma-typescript", "fixture", "jasmine"],

        // List of files to load in the browser.
        files: [
            { pattern: "karma/fixtures/**/*.html" },
            { pattern: "package.json" },
            { pattern: "src/**/*.ts" },
            { pattern: "karma/setup/**/*.ts" },
            { pattern: "karma/tests/**/*.ts" },
        ],

        // Preprocess matching files before serving them to the browser.
        // Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
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

        // Start these browsers.
        // Available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: [],

        // Test results reporter to use.
        // Possible values: 'dots', 'progress'.
        // Available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ["progress"],

    });
};
