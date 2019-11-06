import * as webpack from "webpack";
import * as merge from "webpack-merge";

import CommonConfig from "./base";

// Webpack configuration docs:
// https://webpack.js.org/configuration
const DevConfig: webpack.Configuration = {

    mode: "development",

    entry: {
        clarity: "./webpack/globalize.ts",
        decode: "./webpack/globalizeDecode.ts",
    },

    output: {
        filename: "[name].dev.js"
    },

    devtool: "inline-source-map"
};

export default merge(CommonConfig, DevConfig);
