"use strict";

let setCommonOptions = require("./base");

module.exports = function (config) {

    setCommonOptions(config);

    config.set({
        browsers: ["Firefox"]
    });
};
