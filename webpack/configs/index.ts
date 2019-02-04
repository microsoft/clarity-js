import * as webpack from "webpack";
import * as merge from "webpack-merge";

import CommonConfig from "./base";

// Webpack configuration docs:
// https://webpack.js.org/configuration
const IndexConfig: webpack.Configuration = {

    mode: "production",

    entry: "./src/index.ts",

    output: {
        libraryTarget: "commonjs",
        filename: "index.js"
    },

    optimization: {
        minimize: false
    }

};

export default merge(CommonConfig, IndexConfig);
