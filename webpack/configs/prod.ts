import * as UglifyJsPlugin from "uglifyjs-webpack-plugin";
import * as webpack from "webpack";
import * as merge from "webpack-merge";

import CommonConfig from "./base";

// Webpack configuration docs:
// https://webpack.js.org/configuration
const ProdConfig: webpack.Configuration = {

    mode: "production",

    entry: {
        clarity: "./webpack/globalize.ts",
        decode: "./decode/clarity.ts"
    },

    output: {
        path: `${__dirname}/../../build`,
        filename: "[name].min.js"
    },

    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: false
            })
        ]
    },

    performance: {
        // Debug output - not needed in production
        hints: false
    },

    stats: {
        // Debug output - not needed in production
        warnings: false
    }
};

export default merge(CommonConfig, ProdConfig);
