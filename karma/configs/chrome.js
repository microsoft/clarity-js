"use strict";

let setCommonOptions = require("./base");

module.exports = function (config) {

    setCommonOptions(config);

    config.set({

        browsers: ["ChromeNoSandbox"],

        // Chrome crashes the page when opened in a sandbox
        customLaunchers: {
            ChromeNoSandbox: {
                base: "Chrome",
                flags: ["--no-sandbox"]
            }
        },

    });
};
