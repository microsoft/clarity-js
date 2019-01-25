import * as webpack from "webpack";

import { TsConfigPathsPlugin } from "awesome-typescript-loader";

// Webpack configuration docs:
// https://webpack.js.org/configuration
const CommongConfig: webpack.Configuration = {

    entry: "./webpack/globalize.ts",

    output: {
        path: `${__dirname}/../../build`
    },

    resolve: {
        extensions: [".ts", ".js", ".json"],
        plugins: [new TsConfigPathsPlugin()],
    },

    module: {
        rules: [
            // All files with a '.ts' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.ts$/, loader: "awesome-typescript-loader" },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    }

};

export default CommongConfig;
