import * as webpack from "webpack";
import * as merge from "webpack-merge";

import CommonConfig from "./base";

const DevConfig: webpack.Configuration = {

    mode: "development",

    output: {
        filename: "clarity.js"
    },

    devtool: "inline-source-map"
};

export default merge(CommonConfig, DevConfig);
