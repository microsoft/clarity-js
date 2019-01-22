import * as UglifyJsPlugin from "uglifyjs-webpack-plugin";
import * as webpack from "webpack";
import * as merge from "webpack-merge";

import CommonConfig from "./base";

const ProdConfig: webpack.Configuration = {

    mode: "production",

    output: {
        filename: "clarity.min.js"
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify("production")
        })
    ],

    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                cache: false
            })
        ]
    },

    stats: {
        warnings: false
    }
};

export default merge(CommonConfig, ProdConfig);
