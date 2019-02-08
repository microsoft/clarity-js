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
            "karma/fixtures/**/*.html",
            "package.json",
            "build/clarity.min.js",
            "src/converters/**/*.ts",
            "karma/setup/**/*.ts",
            "karma/tests/**/*.ts",
            "src/**/*.ts"
        ],

        // Preprocess matching files before serving them to the browser.
        // Available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            "**/*.ts": ["karma-typescript"],
            "**/*.html": ["html2js"],
            "**/*.json": ["json_fixtures"],
        },

        karmaTypescriptConfig: {
            tsconfig: "tsconfig.json",

            compilerOptions: {
                "sourceMap": true
            },
            
            bundlerOptions: {
                // There is a module resolution bug for typings files with tsconfig paths
                // A workaround is to add each such file to bundlerOptions.exclude
                // https://github.com/monounity/karma-typescript/issues/315#issuecomment-461746455
                exclude: [
                    "@clarity-types/compressionworker",
                    "@clarity-types/config",
                    "@clarity-types/core",
                    "@clarity-types/index",
                    "@clarity-types/instrumentation",
                    "@clarity-types/layout",
                    "@clarity-types/performance",
                    "@clarity-types/pointer",
                    "@clarity-types/viewport"
                ]
            },

            // Exclude all files from coverage
            // NOTE: When we want to run coverage, we need a way to exclude BLOB files created by compression workers
            // Otherwise Karma can't map those blobs to an actual file and it causes an error '__cov_..... is undefined'
            coverageOptions: {
                exclude: [/^.*$/]
            }
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

        // Disallow Karma launching multiple browsers at the same time
        concurrency: 1

    });
};
