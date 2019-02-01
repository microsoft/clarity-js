import * as webpack from "webpack";
import * as merge from "webpack-merge";

import CommonConfig from "./base";

// Webpack configuration docs:
// https://webpack.js.org/configuration
const IndexConfig: webpack.Configuration = {

    mode: "development",

    entry: "./src/index.ts",

    output: {
        libraryTarget: "commonjs",
        filename: "index.js"
    }
};

export default merge(CommonConfig, IndexConfig);
