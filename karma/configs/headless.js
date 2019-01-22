"use strict";

let setCommonOptions = require("./base");

module.exports = function (config) {

    setCommonOptions(config);

    config.set({

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
