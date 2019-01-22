import * as webpack from "webpack";

import { TsConfigPathsPlugin } from "awesome-typescript-loader";

const CommongConfig: webpack.Configuration = {

    entry: "./webpack/globalize.ts",

    output: {
        path: `${__dirname}/../../build`
    },

    resolve: {
        extensions: [".ts", ".mjs", ".js", ".json"],
        plugins: [new TsConfigPathsPlugin()]
    },

    module: {
        rules: [
            // All files with a '.ts' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.ts$/, loader: "awesome-typescript-loader" },

            { test: /\.mjs$/, include: /node_modules/, type: "javascript/auto" },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },

    performance: {
        hints: false
    }

};

export default CommongConfig;
