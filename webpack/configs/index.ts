import * as webpack from "webpack";
import * as merge from "webpack-merge";

import CommonConfig from "./base";

// Webpack configuration docs:
// https://webpack.js.org/configuration
const IndexConfig: webpack.Configuration = {

    mode: "production",

    entry: {
        index: "./src/index.ts",
        decode: "./decode/clarity.ts"
    },

    output: {
        libraryTarget: "commonjs",
        filename: "[name].js"
    },

    optimization: {
        minimize: false,
        splitChunks: {
            // include all types of chunks
            chunks: "all"
        }
    }

};

export default merge(CommonConfig, IndexConfig);
